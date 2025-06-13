# Use micromamba as base image
FROM mambaorg/micromamba:1.5.1

# Set working directory
WORKDIR /app

# Copy environment file
COPY environment.yml .

# Create the environment
RUN micromamba install -y -n base -f environment.yml && \
    micromamba clean -a -y

# Copy application code
COPY . .

# Set the default command
CMD ["micromamba", "run", "-n", "base", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 