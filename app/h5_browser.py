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
from datetime import datetime
from general_functions import *
from .dataset_cache import dataset_cache

from index_string import index_string
from common_explorer import protect_dashviews, generate_basic_components, add_common_callbacks

# ======= helpful classes
class H5SciCatDataset:
    def __init__(self, h5filename):
        self.h5file = h5py.File(h5filename, 'r')
        self.metadata_dictionary = {}
        self.creation_time = datetime.fromtimestamp(self.h5file.attrs['time_id']).isoformat()
        self.size = os.path.getsize(h5filename)
        self.dataset_name = os.path.basename(os.path.splitext(h5filename)[0])
                       
    def get_info(self,k,v):
        info = self.metadata_dictionary
        info[k] = {}
        for eachkey in v.attrs.keys():
            info[k][eachkey] = v.attrs[eachkey]
                       
    def nest_json(self, k,v):
        d = self.metadata_dictionary
        keys=k.split("/")
        for key in keys:
            if key in d.keys():
                d = d[key]
            else:
                d[key] = {}
        for eachkey in v.attrs.keys():
            d[key][eachkey] = v.attrs[eachkey]

class ScopeFoundryJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.int32):
            return int(obj)
        if isinstance(obj, np.int64):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        
        return json.JSONEncoder.default(self, obj)



def add_dash(server):
    # ============================== DEFINE DASH ENDPOINT AND PAGE TITLE ==================
    dash_endpoint = "h5_browser"
    dash_app_title = "H5 Browser"
    
    dashapp = dash.Dash(__name__, 
                        server = server, 
                        use_pages = False, 
                        url_base_pathname = f"/datasets/{dash_endpoint}/", 
                        external_stylesheets=[dbc.themes.BOOTSTRAP], 
                        suppress_callback_exceptions = True)

        
    dashapp.index_string = index_string

    basic_layout = generate_basic_components(dash_app_title, reload_interval = 300, one_or_more = "one")

    #  ================================= DEFINE APP COMPONENTS =========================
    additional_app_components = [
                                    html.H5(id = "dataset-info1"),
                                    html.H5(id = "dataset-info2"),
                                    html.Div(id = "json-info") 
                                ]



    
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
        Output(component_id='dataset-info1', component_property='children'),
        Output(component_id='dataset-info2', component_property='children'),
        Output(component_id='json-info', component_property='children'),
        Input("auth-var", "value"),
        Input("url", "pathname"),
        Input("kw-checklist", "value"))
    def vrowse(auth, url_path, dsvalue):
        if auth is None:
            raise PreventUpdate
        else:
            dsid = dsvalue.strip('"').strip("'")
            print(f"checking for {dsid} in cache")
            dataset_cache(dsid, config=current_app.config, always_sync=False)
            dsname = glob.glob(f"./assets/{dsid}/*.h5")[-1]
            
            scicat_h5 = H5SciCatDataset(dsname)
            scicat_h5.h5file.visititems(scicat_h5.nest_json)
    
            h1 = f"dataset: {os.path.basename(dsname)}"
            h2 = f"dataset id: {dsid}"
            json_metadata = json.dumps(scicat_h5.metadata_dictionary, cls = ScopeFoundryJSONEncoder, indent = 4)
            return(h1,h2, json_metadata)

    #  ================================= // ================== // =========================
    
    return(server)
