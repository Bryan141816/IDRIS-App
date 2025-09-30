from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PAYMONGO_SECRET_KEY: str

    model_config = {
        "env_file": ".env2",
        "env_file_encoding": "utf-8",
    }

settings = Settings()
