import xraylib as xrl


def get_emission_spectra(atomic_number: int):
    """
    Gets the emission spectra for a specific element.
    Args:
        atomic_number (int): Atomic number of the element
    Returns:
        dict: Dictionary containing emission spectra data for various emission lines (K and L).
              Returns None for lines that are not available for the given element.
    """
    print(f"\n=== Starting get_emission_spectra() in periodic_table_functions.py ===")
    
    # Initialize all energies to None
    ka1_energy = ka2_energy = kb1_energy = None
    la1_energy = la2_energy = lb1_energy = lb2_energy = None
    lg1_energy = ma1_energy = None
    
    # K lines
    try:
        ka1_energy = xrl.LineEnergy(atomic_number, xrl.KA1_LINE)
    except ValueError:
        # KA1 line not available for this element
        pass

    try:
        ka2_energy = xrl.LineEnergy(atomic_number, xrl.KA2_LINE)
    except ValueError:
        pass

    try:
        kb1_energy = xrl.LineEnergy(atomic_number, xrl.KB1_LINE)
    except ValueError:
        pass

    # L lines
    try:
        la1_energy = xrl.LineEnergy(atomic_number, xrl.LA1_LINE)
    except ValueError:
        pass

    try:
        la2_energy = xrl.LineEnergy(atomic_number, xrl.LA2_LINE)
    except ValueError:
        pass

    try:
        lb1_energy = xrl.LineEnergy(atomic_number, xrl.LB1_LINE)
    except ValueError:
        pass

    try:
        lb2_energy = xrl.LineEnergy(atomic_number, xrl.LB2_LINE)
    except ValueError:
        pass

    # Gamma and M lines
    try:
        lg1_energy = xrl.LineEnergy(atomic_number, xrl.LG1_LINE)
    except ValueError:
        pass

    try:
        ma1_energy = xrl.LineEnergy(atomic_number, xrl.MA1_LINE)
    except ValueError:
        pass
        
        
    print(f"\n=== Ending get_emission_spectra() in periodic_table_functions.py ===")    
    return {
        "ka1_energy": ka1_energy,
        "ka2_energy": ka2_energy,
        "kb1_energy": kb1_energy,
        "la1_energy": la1_energy,
        "la2_energy": la2_energy,
        "lb1_energy": lb1_energy,
        "lb2_energy": lb2_energy,
        "lg1_energy": lg1_energy,
        "ma1_energy": ma1_energy
    }