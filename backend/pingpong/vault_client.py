# backend/vault_client.py
import os
import hvac
import time
from functools import wraps

def retry_vault_operation(max_retries=5, delay=2):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    #print(f"Error retrieving secret: {e}")
                    if attempt < max_retries - 1:
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator

@retry_vault_operation()
def get_vault_client():
    return hvac.Client(
        url=os.environ.get('VAULT_ADDR', 'http://vault:8200'),
        token=os.environ.get('VAULT_TOKEN', 'myroot')
    )

@retry_vault_operation()
def get_secret(path, key):
    client = get_vault_client()
    try:
        secret = client.secrets.kv.v2.read_secret_version(path=path)
        return secret['data']['data'][key]
    except Exception as e:
        #print(f"Error retrieving secret: {e}")
        return None