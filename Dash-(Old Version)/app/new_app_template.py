import glob
import dash
from dash import Dash, html, dcc, callback, Output, Input, State, Patch, register_page
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
import pandas as pd
import numpy as np
import json
import h5py
from flask import current_app, session
import sys

from general_functions import *
from .dataset_cache import dataset_cache
from index_string import index_string

from common_explorer import protect_dashviews, generate_basic_components, add_common_callbacks


def add_dash(server):
    # ============================== DEFINE DASH ENDPOINT AND PAGE TITLE ==================
    dash_endpoint = ""
    dash_app_title = ""
    
    dashapp = dash.Dash(__name__, 
                        server = server, 
                        use_pages = False, 
                        url_base_pathname = f"/datasets/{dash_endpoint}/", 
                        external_stylesheets=[dbc.themes.BOOTSTRAP], 
                        suppress_callback_exceptions = True)

        
    dashapp.index_string = index_string

    basic_layout = generate_basic_components(dash_app_title, reload_interval = 600, one_or_more = "one", kw_suggestion = "dynamic vapor sorption")

    #  ================================= DEFINE APP COMPONENTS =========================
    additional_app_components = [ ]



    
    #  ================================= // ================== // =========================
    
    dashapp.layout = dbc.Container(
                                   basic_layout + additional_app_components, 
                                   fluid=True, 
                                   style={"margin": "0 auto", "max-width": "80%"}
                                  )

   # protect_dashviews(dashapp)
    add_common_callbacks(dashapp) 
   
    #  ================================= DEFINE APP CALLBACKS =========================
  

    #  ================================= // ================== // =========================
    
    return(server)
