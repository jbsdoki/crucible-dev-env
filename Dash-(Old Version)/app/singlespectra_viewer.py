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

def add_dash(server):
    from app.routes import auth
    PROVIDER_NAME = 'orcid'
    oidc_auth_orcid = auth.oidc_auth(PROVIDER_NAME)

    def protect_dashviews(dashapp):
        for view_func in dashapp.server.view_functions:
            if view_func.startswith(dashapp.config.url_base_pathname):
                dashapp.server.view_functions[view_func] = oidc_auth_orcid(dashapp.server.view_functions[view_func])

    dashapp = dash.Dash(__name__, 
                        server=server, 
                        use_pages = False, 
                        url_base_pathname = f"/datasets/singlespectra_viewer/", 
                        external_stylesheets=[dbc.themes.BOOTSTRAP], 
                        suppress_callback_exceptions = True)

    
    # layout
    dashapp.layout = dbc.Container([
            html.H1('Single Spectrum Explorer', id = "page-loaded", style={'textAlign':'center'}),
            html.Div(None, id = "auth_var"),
            dcc.Location(id='url', refresh=False),
            html.H3("Spectrum"),
            dcc.Graph(id='fig1', figure = ""), 
            html.H5(id="hover-text", children="moo"), 
            ],
        fluid=True, 
        style={"margin": "0 auto", "max-width": "80%"})

    protect_dashviews(dashapp)


    @dashapp.callback(
        Output(component_id='auth_var', component_property='value'),
        Input("page-loaded", "value"),
        Input("url", "pathname"))
    def authorize_user(pageload, url_path):
        dsid = url_path.split("/")[-1]
        scicat_client = establish_scicat_client("production")
        authorized_datasets = scicat_auth(session['user_info']['sub'], scicat_client) # return this as state
        if dsid in authorized_datasets.values():
            print ("# ================================================================================================= Returning Authorized")
            return("Authorized")
        else:
            print ("# ================================================================================================= Returning None")
            return(None)


    @dashapp.callback(
        Output(component_id='fig1', component_property='figure'),
        Input("auth_var", "value"),
        Input("url", "pathname"))
    def gen_fig1(auth, page_url):
        if auth is None:
            raise PreventUpdate
        else:
            dsid = page_url.split("/")[-1]
            dsname = glob.glob(f"./assets/{dsid}/*.h5")[-1]
            with h5py.File(dsname, 'r') as f:
                measure = list(f['measurement'].keys())[0]
                M = f[f'measurement/{measure}']
                spec = np.array(M['spectrum'])
                raman = np.array(M['raman_shifts'])
            fig1 = go.FigureWidget()
            spec_line = go.Scatter(x=raman, y=spec, name='hover_trace')
            fig1.add_trace(spec_line)
            return(fig1)

    @dashapp.callback(
        Output('hover-text', 'children'),
        [Input('fig1', 'hoverData')])
    def display_hoverdata(hoverData):
        return(json.dumps(hoverData, indent=2))
    

 
    return(server)








