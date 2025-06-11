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
    #dash_endpoint = "/dvs_viewer"
    dash_app_title = "Dynamic Vapor Sorption Explorer"
    
    dashapp = dash.Dash(__name__, 
                        server = server, 
                        use_pages = False, 
                        url_base_pathname = f"/datasets/dvs_viewer/", 
                        external_stylesheets=[dbc.themes.BOOTSTRAP], 
                        suppress_callback_exceptions = True)

        
    dashapp.index_string = index_string

    basic_layout = generate_basic_components(dash_app_title, reload_interval = 600, one_or_more = "one", kw_suggestion = "dynamic vapor sorption")

    #  ================================= DEFINE APP COMPONENTS =========================
    additional_app_components = [ html.H5(id = 'info', children = "Currently showing:", style = {'margin-top':'50px', 'margin-bottom':'10px'}),
                                    html.Div(id = 'dataset-name', style={'width': '100%', 'margin-bottom': '10px'}),
                                    html.Div(id = 'dataset-id', style={'width': '100%', 'margin-bottom': '30px'}),
                                    html.H3("DVS Change in Mass Plot"),
                                 dbc.Row([ dcc.Graph(id='fig1', figure = "")], style = {'width':'75%'}),
                                 dbc.Row([
                                     dbc.Col([
                                                 html.Div(id = 'x-dropdown-placeholder'),
                                                 html.Div(id = 'y1-dropdown-placeholder'),
                                                 html.Div(id = 'y2-dropdown-placeholder')
                                                 ], style = {'margin-right':'10px'}),
                                     dbc.Col([  html.Div(id = 'xmin-placeholder'),
                                                html.Div(id = 'y1min-placeholder'),
                                                html.Div(id = 'y2min-placeholder'),
                                                  
                                               ], style = {'margin-right':'10px'}), 
                                     dbc.Col([
                                         html.Div(id = 'xmax-placeholder'),
                                         html.Div(id = 'y1max-placeholder'),
                                         html.Div(id = 'y2max-placeholder'),
                                     ])
                                     
                                    ]),
                                    dcc.Store(id = 'data-df'),
                                    html.Div(id = "fig1-info")
                                ]



    
    #  ================================= // ================== // =========================
    
    dashapp.layout = dbc.Container(
                                   basic_layout + additional_app_components, 
                                   fluid=True, 
                                   style={"margin": "0 auto", "max-width": "80%"}
                                  )

    #protect_dashviews(dashapp)
    add_common_callbacks(dashapp) 
   
    #  ================================= DEFINE APP CALLBACKS =========================
       
    @dashapp.callback(
        Output(component_id='x-dropdown-placeholder', component_property='children'),
        Output(component_id='y1-dropdown-placeholder', component_property='children'),
        Output(component_id='y2-dropdown-placeholder', component_property='children'),
        Output(component_id='dataset-name', component_property='children'),
        Output(component_id='dataset-id', component_property='children'),
       # Output(component_id = 'data-df', component_property = 'data'),
        Input("auth-var", "value"),
        Input("url", "pathname"),
        Input("kw-checklist", "value"),
    )
    def get_data(auth, url_path, dsvalue):
        if auth is None:
            raise PreventUpdate
        else:
            print(f"reading in .. {dsvalue}")
            dsid = dsvalue.strip('"').strip("'")
    
            print(f"checking for {dsid} in cache")
            dataset_cache(dsid, config=current_app.config, always_sync=False)
    
            print(f"{current_app.config=}")
    
            dsname = glob.glob(f"./assets/{dsid}/*.xls")[-1]
            tmp = pd.read_excel(dsname, 
                   sheet_name = "DVS Data", 
                   index_col = 0,
                   header= None, 
                   usecols= [0,1])
        
            num_rows = tmp.loc['Data Start Row:', 1]
            df = pd.read_excel(dsname, sheet_name = "DVS Data", 
                               skiprows = (num_rows-2))
            plot_ops = [x for x in df.columns if 'Unnamed' not in x]
            return(dbc.Row([html.Div("choose x axis field to plot"),
                            dcc.Dropdown(id = 'x', placeholder = "Select a field to plot on the x axis", options = plot_ops,value = 'Time [minutes]')]),
                   dbc.Row([html.Div("choose primary y axis field to plot"),
                            dcc.Dropdown(id = 'y1', placeholder = "Select a field to plot on the primary y axis", options = plot_ops,value = 'dm (%) - ref')]),
                   dbc.Row([html.Div("choose secondary y axis field to plot"), 
                            dcc.Dropdown(id = 'y2', placeholder = "Select a field to plot on the secondary y axis", options = plot_ops,value = 'Target Partial Pressure (Solvent A) [%]')]),
                  dsname, dsid)#, df.to_json(date_format = "iso", orient = "split"))
                   

    @dashapp.callback(
        Output(component_id = 'xmin-placeholder', component_property = 'children'),
        Output(component_id = 'xmax-placeholder', component_property  = 'children'),
        Output(component_id = 'y1min-placeholder', component_property = 'children'),
        Output(component_id = 'y1max-placeholder', component_property  = 'children'),
        Output(component_id = 'y2min-placeholder', component_property = 'children'),
        Output(component_id = 'y2max-placeholder', component_property  = 'children'),
        Input("kw-checklist", "value"),
        Input("x", "value"),
        Input("y1", "value"),
        Input("y2", "value"),
      #  Input("data-df", "data")
    )
    def set_props(dsvalue, x, y1, y2):#, dfjson):
        # print(f"reading in .. {dsvalue}")
        dsid = dsvalue.strip('"').strip("'")

        # print(f"checking for {dsid} in cache")
        # dataset_cache(dsid, config=current_app.config, always_sync=False)

        # print(f"{current_app.config=}")

        dsname = glob.glob(f"./assets/{dsid}/*.xls")[-1]
        tmp = pd.read_excel(dsname, 
               sheet_name = "DVS Data", 
               index_col = 0,
               header= None, 
               usecols= [0,1])
    
        num_rows = tmp.loc['Data Start Row:', 1]
        df = pd.read_excel(dsname, sheet_name = "DVS Data", 
                           skiprows = (num_rows-2))

       # df = pd.read_json(dfjson, orient = "split")

        return(dbc.Row([dbc.Col(html.Div("xmin: ")), dbc.Col(dcc.Input(id = 'xmin', value = 0,style={'width':200}))]),
               dbc.Row([dbc.Col(html.Div("xmax: ")), dbc.Col(dcc.Input(id = 'xmax', value = np.max(df[x])+10,style={'width':200}))]),
               dbc.Row([dbc.Col(html.Div("y1min: ")),dbc.Col( dcc.Input(id = 'y1min', value = 0, style={'width':200}))]),
               dbc.Row([dbc.Col(html.Div("y1max: ")),dbc.Col( dcc.Input(id = 'y1max', value = np.max(df[y1])+10, style={'width':200}))]),
               dbc.Row([dbc.Col(html.Div("y2min: ")),dbc.Col( dcc.Input(id = 'y2min', value = 0, style={'width':200}))]),
               dbc.Row([dbc.Col(html.Div("y2max: ")),dbc.Col( dcc.Input(id = 'y2max', value = np.max(df[y2])+10, style={'width':200}))]))


    @dashapp.callback(
        Output('fig1', 'figure'),
        Input("kw-checklist", "value"),
        Input(component_id = 'x', component_property = 'value'),
        Input(component_id = 'y1', component_property  = 'value'),
        Input(component_id = 'y2', component_property = 'value'),
        Input(component_id = 'xmin', component_property = 'value'),
        Input(component_id = 'xmax', component_property  = 'value'),
        Input(component_id = 'y1min', component_property = 'value'),
        Input(component_id = 'y1max', component_property  = 'value'),
        Input(component_id = 'y2min', component_property = 'value'),
        Input(component_id = 'y2max', component_property  = 'value'),
       # Input("data-df", "data")
    )
    def gen_fig1(dsvalue, x, y1, y2, xmin, xmax, y1min, y1max, y2min, y2max):#, dfjson):

        # print(f"reading in .. {dsvalue}")
        dsid = dsvalue.strip('"').strip("'")

        # print(f"checking for {dsid} in cache")
        # dataset_cache(dsid, config=current_app.config, always_sync=False)

        # print(f"{current_app.config=}")

        dsname = glob.glob(f"./assets/{dsid}/*.xls")[-1]
        tmp = pd.read_excel(dsname, 
               sheet_name = "DVS Data", 
               index_col = 0,
               header= None, 
               usecols= [0,1])
    
        num_rows = tmp.loc['Data Start Row:', 1]
        df = pd.read_excel(dsname, sheet_name = "DVS Data", 
                           skiprows = (num_rows-2))

        #df = pd.read_json(dfjson, orient = "split")
        fig = make_subplots(specs=[[{"secondary_y": True}]])

        # Add traces
        fig.add_trace(
            go.Scatter(x=df[x], y=df[y1], name=y1),
            secondary_y=False,
        )
        
        fig.add_trace(
            go.Scatter(x=df[x], y=df[y2], name=y2),
            secondary_y=True,
        )

        # Set x-axis title
        fig.update_xaxes(title_text=x)
        
        # Set y-axes titles
        fig.update_yaxes(title_text=f"<b>{y1}</b>", secondary_y=False)
        fig.update_yaxes(title_text=f"<b>{y2}</b>", secondary_y=True)
        
        return(fig)

    #  ================================= // ================== // =========================
    
    return(server)
