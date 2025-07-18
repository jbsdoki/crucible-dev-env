from operations import periodic_table_functions


def get_emission_spectra(atomic_number: int):
    """
    Gets the emission spectra for a specific element.
    Args:
        atomic_number (int): Atomic number of the element
    Returns:
        dict: Dictionary containing emission spectra data
    """
    print(f"\n=== Starting get_emission_spectra() in DataService ===")
    return periodic_table_functions.get_emission_spectra(atomic_number)