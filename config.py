import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Sadhika@07")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "weatherhub_db")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))

    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
