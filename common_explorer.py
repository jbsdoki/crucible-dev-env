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
from flask import current_app, session
import sys
import requests 
from app.routes import auth
from general_functions import *
from pycrucible.general_functions import get_secret_2
import time

def generate_basic_components(app_name, reload_interval = None, one_or_more = "more", kw_suggestion = None):
    stime = time.time()
    print(f"starting generate basic components: {stime}")
    basic_components = [dbc.Row(html.Div(dbc.Button("Login", id = 'login-button', n_clicks = None, color = 'primary', size = "sm",
                                               style={'right': '10px','padding': '10px 20px'}),  className="d-grid gap-2 d-md-flex justify-content-md-end", style = {'margin-bottom':'75px'})),
        
                        dbc.Row(html.H1(app_name, id = "page-loaded", style={'textAlign':'center'})),

                        # hiddent things
                        html.Div(None, id = "auth-var"),
                        html.Div(dcc.Location(id = "url", refresh = "False")),
                        html.Div(id = 'hiddendiv'),
                        html.Div(id = "one_or_more_datasets", style={'display': 'none'}, children=one_or_more),
                       
                        # dataset selection
                        html.Div("Select a dataset from the list below or enter a keyword to search for datasets in the box. Then press Go to load data or search results."),
                        dbc.Row([dbc.Col(html.Div(id='authds-dropdown-placeholder'), width = {"size":3, "order":1},  style={ 'margin-bottom': '10px'}),
                                 dbc.Col(dcc.Input(id = 'keyword-search', value = None, placeholder = kw_suggestion), width = {"size":3, "order":2})],  style={ 'margin-bottom': '10px'}),
                        html.Div(dbc.Button("Go", id = 'go-button', n_clicks = None),   style={'width': '100%', 'margin-bottom': '20px'}),
                        html.Div(id = "kw-checklist-placeholder",  style={'margin-bottom': '10px'}),
                        html.Div(id = 'hiddendiv2'),
                        html.Div(id='hiddendiv3')]

    if reload_interval is not None:
        basic_components += [ dcc.Interval(
                                    id='interval-component',
                                    interval=reload_interval*1000, # in milliseconds
                                    n_intervals=0)
                            ]
    etime = time.time()
    print(f"finished generating basic components: Total time = {etime - stime}")
    return(basic_components)

    
def protect_dashviews(dashapp):
    PROVIDER_NAME = 'orcid'
    oidc_auth_orcid = auth.oidc_auth(PROVIDER_NAME)
    for view_func in dashapp.server.view_functions:
        if view_func.startswith(dashapp.config.url_base_pathname):
            dashapp.server.view_functions[view_func] = oidc_auth_orcid(dashapp.server.view_functions[view_func]) 


def gen_kw_results(one_or_more, options, values):
    stime = time.time()
    print(f"starting gen_kw_results: {stime}")
    print(f"{one_or_more=}")
    if one_or_more == "one":
        ds_checklist_comp = dcc.RadioItems(options = options, value = values[0], id = 'kw-checklist', style = {"margin-bottom":"10px"})
        text_ = "Select a dataset to explore"
    else:
        print(f"{options=}")
        print(f"{values}")
        ds_checklist_comp = dcc.Checklist(options = options, value = values, id = 'kw-checklist', style = {"margin-bottom":"10px", "padding": "20px"})
        text_ = "Select one or more dataset(s) to explore"
    etime = time.time()
    print(f"finsihed gen_kw_results:{etime}. Total time = {etime - stime}")
    return([html.H5(text_,  style={'margin-bottom': '10px'}), ds_checklist_comp])


def filter_on_viewer_compatibility(list_to_filter):
    stime = time.time()
    print(f"start filter on viewer: {stime}")
    dropdown_options = [{"label":x["dataset_name"],"value":x["unique_id"]} for x in list_to_filter]
    etime = time.time()
    print(f"finished filter on viewer: {etime}. Total time = {etime - stime}")
    return(dropdown_options)


def get_session_orcid(session):
    stime = time.time()
    print(f"start get session orcid {stime}")
    try:
        orcid = session['user_info']['sub']
    except:
        orcid = "0000-0000-0000-0000"
    etime = time.time()
    print(f"finished get session orcid: {etime}. Total time = {etime - stime}")
    return(orcid)


def get_authorized_datasets(orcid, current_app, url_parse, kw = None):
    stime = time.time()
    print(f"start get auth datasets {stime}")
    from viewer_config import viewer_data_format_map as viewer_map
    
    if kw is None:
        api_req = f"https://crucible.lbl.gov/api/list_datasets"
    else:
        api_req = f"https://crucible.lbl.gov/api/datasets_by_keyword/{kw}"
    try:
        print("trying auth")
        if len(url_parse) > 0:
            viewer_type = url_parse[0]
            viewer_options = viewer_map[viewer_type]
            for k,v in viewer_options.items():
                api_req += (f"?{k}={v}")
        print(f"{api_req=}")
        apikey = get_secret_2("ADMIN_APIKEY", "projects/776258882599/secrets/crucible_admin_apikey/versions/1")
        authorized_datasets = requests.request(method = "get", url = api_req, headers = {"Authorization":f"Bearer {apikey}"})
        authorized_datasets = authorized_datasets.json()
        print(f"{len(authorized_datasets)=}")
    except Exception as err:
        print(err)
        authorized_datasets = []

    etime = time.time()
    print(f"finished get auth datasets: {etime}. Total time = {etime - stime}")
    return(authorized_datasets)

# ================================================================================================= CALLBACKS 

def add_common_callbacks(app):
    @app.callback(
        Output(component_id='auth-var', component_property='value'),
        Output(component_id = 'authds-dropdown-placeholder', component_property = 'children'),
        Output(component_id = 'kw-checklist-placeholder', component_property = 'children'),
        Output(component_id = 'hiddendiv', component_property = 'children'),
        Input("page-loaded", "value"),
        Input('interval-component','n_intervals'),
        Input('one_or_more_datasets', 'children'),
        Input("url", "pathname"))
    def authorize_user(pageload, n, one_or_more, url_path):
        stime = time.time()
        print(f"start authorize user callback {stime}")
        url_parse = [x for x in url_path.split("/datasets/")[1].split("/") if x != ""]
        orcid = get_session_orcid(session)
        authorized_datasets = get_authorized_datasets(orcid, current_app, url_parse)    

        # these are the datasets the user has permission to see
        dropdown_options = filter_on_viewer_compatibility(authorized_datasets)
        print(dropdown_options[0])
        ds_dropdown_comp = dcc.Dropdown(options = dropdown_options, value = None, id = "dataset-options")
        
        # if dataset info passed to browser, check auth
        if len(url_parse) > 1:
            # if its a dsid make sure its in user auth list
            if "dsid" in url_parse[-1]:
                dsid = url_parse[-1].replace("dsid=", "")
                if dsid in [x["unique_id"] for x in authorized_datasets]:
                    dsname = [x["dataset_name"] for x in authorized_datasets if x["unique_id"] == dsid]
                    print(f"{dsname=}")
                    kwcomps = gen_kw_results(one_or_more, [{"label":dsname,"value":dsid}], [dsid])
                    etime = time.time()
                    print(f"finished auth user callback: {etime}. Total time = {etime - stime}")
                    return("Authorized",
                           ds_dropdown_comp,
                           kwcomps, 
                           None)
                else:
                    etime = time.time()
                    print(f"finished auth user callback: {etime}. Total time = {etime - stime}")
                    return(None, 
                           ds_dropdown_comp, 
                           None, 
                           None)
            
            # if its a keyword, get the associated auth datasets
            elif "kw" in url_parse[-1]:
                kw = url_parse[-1].replace("kw=", "")
                try:
                    kw_matches = get_authorized_datasets(orcid, current_app, url_parse, kw)
                except Exception as err:
                    print(err)
                    kw_matches = []

                
                if len(kw_matches) > 0:
                    kw_options = filter_on_viewer_compatibility(kw_matches)
                    kwcomps = gen_kw_results(one_or_more, kw_options, [kw_matches[-1]["unique_id"]])
                    etime = time.time()
                    print(f"finished auth user callback: {etime}. Total time = {etime - stime}")
                    return("Authorized", 
                           ds_dropdown_comp, 
                           kwcomps,
                           None)
                else:
                    etime = time.time()
                    print(f"finished auth user callback: {etime}. Total time = {etime - stime}")
                    return(None,
                           ds_dropdown_comp,
                           None, 
                           None)
            else:
                browser = url_path.split("/")[-2]
                etime = time.time()
                print(f"finished auth user callback: {etime}. Total time = {etime - stime}")
                return(None,
                       None, 
                       None,
                       dcc.Location(pathname = f"/datasets/{browser}/", id = 'datasetpage', refresh = True))
        else:
            ds_dropdown_comp = dcc.Dropdown(options = dropdown_options, value = None, id = "dataset-options")
            etime = time.time()
            print(f"finished auth user callback: {etime}. Total time = {etime - stime}")
            return("Authorized", 
                   ds_dropdown_comp,
                   None, 
                   None)


    @app.callback(
            Output(component_id = 'hiddendiv2', component_property='children'),
            Input(component_id = 'dataset-options', component_property = 'value'),
            Input(component_id = 'keyword-search', component_property='value'),
            Input(component_id = 'go-button', component_property = 'n_clicks'),
            Input(component_id ='url', component_property = 'pathname'))
    def setup_explorer(dataset, keyword,go, url):
        if go is None:
            raise PreventUpdate  
        else:
            stime = time.time()
            print(f"starting setup explorer callback {stime}")
            print(url.split("/datasets/")[1].split("/"))
            browser = url.split("/datasets/")[1].split("/")[0]
            if dataset is not None:
                etime = time.time()
                print(f"finished setup explorer: {etime}. Total time = {etime - stime}")
                return(dcc.Location(pathname = f"/datasets/{browser}/dsid={dataset}", id = 'datasetpage', refresh = True))
            elif keyword is not None:
                etime = time.time()
                print(f"finished setup explorer: {etime}. Total time = {etime - stime}")
                return(dcc.Location(pathname = f"/datasets/{browser}/kw={keyword}", id = 'datasetpage', refresh = True))
            else:
                etime = time.time()
                print(f"finished setup explorer: {etime}. Total time = {etime - stime}")
                return(dcc.Location(pathname = f"/datasets/{browser}/", id = 'datasetpage', refresh = True))


    @app.callback(
        Output(component_id='hiddendiv3', component_property='children'),
        Input(component_id = 'login-button', component_property = 'n_clicks'))
    def return_browser(n_clicks):
        if n_clicks is None:
            raise PreventUpdate
        else:
            return(dcc.Location(pathname = f"/dash/", id = 'loginpage', refresh = True))

