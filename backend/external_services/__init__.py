"""
External Services Package
========================

This package contains modules for integrating with external APIs and web services.

Modules:
- orcid_service: ORCID OAuth 2.0 authentication and API integration
- Future modules: database connectors, other third-party APIs

Usage:
    from external_services import orcid_service
"""

# Import all services to make them available at package level
from .orcid_service import orcid_service

__all__ = ['orcid_service']