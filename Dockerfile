FROM ubuntu:focal
USER root

# settings
USER root
WORKDIR /root/
ARG DEBIAN_FRONTEND=noninteractive
ARG orcid_client_secret
ARG propdb_apikey
ARG pyoidc_secret
ARG gpat

ENV TZ=Etc/UTC
ENV ORCID_CLIENT_SECRET=$orcid_client_secret
ENV PROPDB_APIKEY=$propdb_apikey
ENV PYOIDC_SECRET=$pyoidc_secret
ENV GPAT=$gpat

# basic utility packages
RUN apt-get update
RUN apt-get install -yq --no-upgrade wget zip make curl git


# python / miniconda
RUN mkdir -p /root/miniconda3 &&  wget https://repo.anaconda.com/miniconda/Miniconda3-py311_24.1.2-0-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh && bash /root/miniconda3/miniconda.sh -b -u -p /root/miniconda3 && rm -rf /root/miniconda3/miniconda.sh

ENV PATH "/root/miniconda3/bin:$PATH"


# python packages
RUN conda install -c anaconda -y pip flask numpy pandas ipywidgets && conda install -c conda-forge -y dash importlib-metadata rclone==1.65.2

RUN pip install Flask-pyoidc \
                pyyaml \
                dash_bootstrap_components \
                dash-daq \
                h5py \
                requests \
                matplotlib \
                lmfit \
                pillow \
                imageio \
                pydantic==2.0.2 \
                gunicorn \
                Werkzeug \
                xlrd \
                igor2
                
RUN pip install git+https://${GPAT}@github.com/MolecularFoundry/pycrucible.git@02b11f6

# files
RUN mkdir assets
COPY . .

ENV PORT=5000
ENV GUNICORN_CMD_ARGS="--bind=0.0.0.0:"$PORT

#ENTRYPOINT python dash_app.py
#ENTRYPOINT ["gunicorn", "dash_app:app"]
CMD gunicorn dash_app:app main
