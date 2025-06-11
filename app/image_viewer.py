import glob
import dash
from dash import Dash, html, dcc, callback, Output, Input, State, Patch, register_page
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
import json
import h5py
from flask import current_app, session
import sys

from index_string import index_string
from common_explorer import protect_dashviews, generate_basic_components, add_common_callbacks
from .dataset_cache import dataset_cache

def add_dash(server):
    # ============================== DEFINE DASH ENDPOINT AND PAGE TITLE ==================
    dash_endpoint = "image_viewer"
    dash_app_title = "Simple Image Viewer"
    
    dashapp = dash.Dash(__name__, 
                        server = server, 
                        use_pages = False, 
                        url_base_pathname = f"/datasets/{dash_endpoint}/", 
                        external_stylesheets=[dbc.themes.BOOTSTRAP], 
                        suppress_callback_exceptions = True)

        
    dashapp.index_string = index_string

    basic_layout = generate_basic_components(dash_app_title)

    #  ================================= DEFINE APP COMPONENTS =========================
    additional_app_components = [html.Img(id = "myimage")]



    
    #  ================================= // ================== // =========================
    
    dashapp.layout = dbc.Container(
                                   basic_layout + additional_app_components, 
                                   fluid=True, 
                                   style={"margin": "0 auto", "max-width": "80%"}
                                  )

    protect_dashviews(dashapp)
    add_common_callbacks(dashapp) 
   
    #  ================================= DEFINE APP CALLBACKS =========================
    @dashapp.callback(
        Output(component_id='myimage', component_property='src'),
        Input("auth-var", "value"),
        Input("url", "pathname"))
    def show_image(auth, page_url):
        if auth is None:
            raise PreventUpdate
        else:
            dsid = page_url.split("/")[-1]
            print(f"checking for {dsid} in cache")
            dataset_cache(dsid, config=current_app.config, always_sync=False)
            dsname = glob.glob(f"./assets/{dsid}/*.h5.JPG")[-1]
            image = Image.open(dsname)
            image.thumbnail((900,900))
            image.convert("RGB")
            return(image)

    #  ================================= // ================== // =========================
    
    return(server)
