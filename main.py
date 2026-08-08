import os
import re
from flask import Flask, request, jsonify
from datetime import datetime
import mysql.connector as sql
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import joblib
import xgboost as xgb
import pandas as pd
import requests

crop = 'Wheat'
soil = 'Black Soil'
seedling_stage = 'Germination'

latest_data_by_sensor = {}
latest_prediction_by_sensor = {}

SENSOR_ID_PATTERN = re.compile(r'^[A-Za-z0-9_]+$')

model = xgb.XGBClassifier()
model.load_model("xgb_crop_model.json")
encoders = joblib.load("label_encoders.joblib")

# ---------------------------------------------------------------------------
# DATABASE CONNECTION
# Reads from environment variables so real credentials never live in the
# code / repo. Locally these fall back to your old defaults; on Render you
# set the DB_* variables in the dashboard (see deployment steps).
# ---------------------------------------------------------------------------
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "root")
DB_NAME = os.environ.get("DB_NAME", "Neurobots")
DB_SSL_CA = os.environ.get("DB_SSL_CA")  # path to ca.pem, only needed for Aiven

connect_kwargs = dict(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    connection_timeout=10,
)
if DB_SSL_CA:
    connect_kwargs["ssl_ca"] = DB_SSL_CA
    connect_kwargs["ssl_verify_cert"] = True

conn = sql.connect(**connect_kwargs)
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS SENSORS (
        Sensor_no varchar(50) PRIMARY KEY,
        last_seen varchar(50)
    );
""")
cursor.close()

# ---------------------------------------------------------------------------
# FLASK APP
# static_folder points at the "static" directory where index.html,
# style.css and script.js now live, so the same app serves the frontend
# and the API.
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder="static", static_url_path="")
scheduler = BackgroundScheduler()


@app.route('/')
def serve_index():
    return app.send_static_file('index.html')


@app.route('/sensor', methods=["POST"])
def recieve_sensor():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"status": "error", "message": "Expected a JSON object body"}), 400

    current_sensor = payload.get('ESP_no')
    if not current_sensor or not SENSOR_ID_PATTERN.match(str(current_sensor)):
        return jsonify({"status": "error", "message": "Missing or invalid ESP_no"}), 400

    payload['time'] = str(datetime.now())
    latest_data_by_sensor[current_sensor] = payload

    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO SENSORS (Sensor_no, last_seen)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE last_seen = VALUES(last_seen)
        """, (current_sensor, str(datetime.now())))

        cursor.execute(
            f'CREATE TABLE IF NOT EXISTS `{current_sensor}` '
            '(ID INT AUTO_INCREMENT PRIMARY KEY,'
            'TIME_STAMP VARCHAR(50),TEMPERATURE DECIMAL(4,1),'
            'HUMIDITY DECIMAL(4,1),SOIL_MOISTURE DECIMAL(4,1))'
        )
        conn.commit()
    finally:
        cursor.close()

    print(payload)
    return jsonify({"status": "ok"}), 200


@app.route('/api/sensors', methods=["GET"])
def get_sensors():
    """Returns the latest reading + watering recommendation for every ESP
    that has ever reported in, so the frontend can render one box per
    sensor without needing to know in advance how many exist."""
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute('SELECT Sensor_no, last_seen FROM SENSORS ORDER BY Sensor_no;')
        rows = cursor.fetchall()

        sensors = []
        for sensor_no, last_seen in rows:
            cursor.execute(
                f'SELECT TIME_STAMP, TEMPERATURE, HUMIDITY, SOIL_MOISTURE '
                f'FROM `{sensor_no}` ORDER BY TIME_STAMP DESC LIMIT 1;'
            )
            row = cursor.fetchone()

            reading = None
            if row:
                reading = {
                    "time": row[0],
                    "temperature": float(row[1]) if row[1] is not None else None,
                    "humidity": float(row[2]) if row[2] is not None else None,
                    "soil_moisture": float(row[3]) if row[3] is not None else None,
                }

            sensors.append({
                "esp_id": sensor_no,
                "last_seen": last_seen,
                "reading": reading,
                # True = needs watering, False = doesn't, None = not computed yet
                "needs_watering": latest_prediction_by_sensor.get(sensor_no),
            })

        return jsonify({"status": "ok", "sensors": sensors}), 200
    finally:
        cursor.close()


def my_scheduled_job():
    """Writes the latest reading for every sensor we've heard from."""
    if not latest_data_by_sensor:
        print("No sensor data received yet, skipping job.")
        return

    cursor = conn.cursor()
    try:
        for sensor, data in latest_data_by_sensor.items():
            temp = data.get('temperature')
            humidity = data.get('humidity')
            soil_moisture = data.get('soil moisture')
            time_stamp = data.get('time')

            if None in (temp, humidity, soil_moisture, time_stamp):
                print(f"Incomplete data for {sensor}, skipping.")
                continue

            cursor.execute(
                f'INSERT INTO `{sensor}` (TIME_STAMP, TEMPERATURE, HUMIDITY, SOIL_MOISTURE) '
                'VALUES (%s, %s, %s, %s)',
                (time_stamp, temp, humidity, soil_moisture)
            )
        conn.commit()
    finally:
        cursor.close()


def fetch_weather():
    global weather_forcast
    global prediction_probability
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=10.5276"
        "&longitude=76.2144"
        "&hourly=temperature_2m,precipitation_probability,precipitation"
        "&forecast_hours=10"
    )

    try:
        data = requests.get(url, timeout=10).json()
    except requests.RequestException as e:
        print(f"Weather fetch failed: {e}")
        return

    hourly = data.get("hourly")
    if not hourly:
        print("Weather response missing 'hourly' data, skipping update.")
        return

    weather_forcast = {}
    prediction_probability = []
    for i in range(10):
        weather_forcast[hourly['time'][i]] = hourly['precipitation_probability'][i]
        prediction_probability.append(hourly['precipitation_probability'][i])


def watering_prediction():
    # Skip until at least one weather fetch has completed.
    if 'prediction_probability' not in globals():
        print("Weather data not ready yet, skipping watering prediction.")
        return

    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute('SELECT * FROM SENSORS;')
        sensor_list = cursor.fetchall()

        for row in sensor_list:
            sensor_name = row[0]
            cursor.execute(f'SELECT * FROM `{sensor_name}` ORDER BY TIME_STAMP DESC LIMIT 1;')
            data = cursor.fetchone()
            if data is None:
                continue

            temp = float(data[1])
            humidity = float(data[2])
            soil_moisture = float(data[3])
            sample = pd.DataFrame([{
                "crop ID": encoders["crop ID"].transform([crop])[0],
                "soil_type": encoders["soil_type"].transform([soil])[0],
                "Seedling Stage": encoders["Seedling Stage"].transform([seedling_stage])[0],
                "MOI": soil_moisture,
                "temp": temp,
                "humidity": humidity,
            }])
            prediction = model.predict(sample)
            print(sensor_name, prediction)

            final_outcome = 0
            if prediction == 1:
                for i in range(9):
                    precipitation_probabiity_that_hour = prediction_probability[i]
                    if i <= 2 and precipitation_probabiity_that_hour > 60 and soil_moisture > 60:
                        final_outcome = 0
                    elif 2 < i <= 4 and precipitation_probabiity_that_hour > 70 and soil_moisture > 70:
                        final_outcome = 0
                    elif 4 < i <= 7 and precipitation_probabiity_that_hour > 80 and soil_moisture > 80:
                        final_outcome = 0
                    elif 7 < i <= 10 and precipitation_probabiity_that_hour > 90 and soil_moisture > 90:
                        final_outcome = 0
                    else:
                        final_outcome = 1
            latest_prediction_by_sensor[sensor_name] = bool(final_outcome)
            print(final_outcome)
    finally:
        cursor.close()


def wrapper_job():
    my_scheduled_job()
    watering_prediction()


fetch_weather()

scheduler.add_job(func=fetch_weather, trigger="interval", seconds=10)
scheduler.add_job(func=wrapper_job, trigger="interval", seconds=10)
scheduler.start()

atexit.register(lambda: scheduler.shutdown())

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)