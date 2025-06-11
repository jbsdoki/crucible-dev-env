import os
import flask
from flask import Flask,session
import datetime
from flask import redirect, url_for
from flask_pyoidc import OIDCAuthentication
from flask_pyoidc.provider_configuration import ProviderConfiguration, ClientMetadata
import dash
from dash import Dash, html, dcc, callback, Output, Input, State, Patch
import argparse
import yaml
import time

def create_app(env_var):
    # config
    env_config_file = f"conf/{env_var}_config.yaml"
    with open(env_config_file, "r") as f:
        env_config = yaml.safe_load(f)

    # secrets
    with open(".secrets", "r") as f:
        secrets = yaml.safe_load(f)

    server = Flask(__name__)
    print(server)
    server.config['environment'] = env_var
    server.config.update(env_config)
    server.config.update(secrets)
    server.config.update({'OIDC_REDIRECT_URI': env_config['redirect_uri'],
                            #'OIDC_REDIRECT_URI':"https://34.28.44.212:5000/auth", 
            			    #'OIDC_REDIRECT_URI': 'https://128.3.112.190:5000/auth',
                            # 'OIDC_REDIRECT_URI': 'https://boysenberry.dhcp.lbl.gov:5000/auth',
                           'SECRET_KEY': secrets['PYOIDC_SECRET'],
                           'PERMANENT_SESSION_LIFETIME': datetime.timedelta(days=1).total_seconds()
                         })
    print("registering the blueprints")
    register_blueprints(server)
    print("blueprint registration complete")
    print("registering the dashapps")
    print(f"server name: {server.config['SERVER_NAME']}")
    register_dashapps(server)
    return server

   
def register_blueprints(server):
    from app.routes import auth,server_bp
    server.register_blueprint(server_bp)
    print("about to initialize app with auth")
    auth.init_app(server)
    print("app initialization complete")

def register_dashapps(server):
    from app.explore_data import add_dash as ad1
    from app.hyperspectra_viewer import add_dash as ad2
    from app.dvs_viewer import add_dash as ad3
    from app.powerfit_viewer import add_dash as ad4
    from app.demo_viewer import add_dash as ad5
    
    server = ad1(server) # /datasets
    server = ad2(server) 
    server = ad3(server)
    server = ad4(server)
    server = ad5(server)

    print("dashapps registered to server")
    return(server)
