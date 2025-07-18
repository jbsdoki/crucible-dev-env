import { Stack, Tooltip, IconButton, Box } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CropIcon from '@mui/icons-material/Crop';
import ScaleIcon from '@mui/icons-material/Scale';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import PanToolIcon from '@mui/icons-material/PanTool';
import BlockIcon from '@mui/icons-material/Block';
import { useSpectrumContext } from '../contexts/SpectrumViewerContext';
import { useEffect } from 'react';

interface SpectrumToolbarProps {
  regionSpectrumData?: {
    x: number[];
    y: number[];
    x_label: string;
    x_units: string;
    y_label: string;
    zero_index: number | null;
    fwhm_index: number | null;
  } | null;
  onSelectionModeChange: (isSelecting: boolean) => void;
  isSelectingRange: boolean;
}

/**
 * SpectrumToolbar Component
 * 
 * Provides controls for spectrum visualization including:
 * - Show/Hide Region
 * - Zoom/Pan Mode Toggle
 * - Selection Mode Toggle
 * - Log/Linear Scale Toggle
 * - FWHM Line Toggle
 */
function SpectrumToolbar({ regionSpectrumData, onSelectionModeChange, isSelectingRange }: SpectrumToolbarProps) {
  console.log('SpectrumToolbar: Rendering with:', { 
    hasRegionData: !!regionSpectrumData,
    isSelectingRange
  });

  const { 
    isLogScale, 
    setIsLogScale,
    showFWHM,
    setShowFWHM,
    isZoomMode,
    setIsZoomMode,
    showRegion,
    setShowRegion,
    fwhm_index
  } = useSpectrumContext();

  // Handle zoom mode toggle
  const handleZoomModeToggle = () => {
    console.log('SpectrumToolbar: Toggling zoom mode from:', isZoomMode, 'to:', !isZoomMode);
    setIsZoomMode(!isZoomMode);
  };

  // Handle selection mode toggle
  const handleSelectionModeToggle = () => {
    console.log('SpectrumToolbar: Toggling selection mode to:', !isSelectingRange);
    onSelectionModeChange(!isSelectingRange);
  };

  // Log context value changes
  useEffect(() => {
    console.log('SpectrumToolbar: Context values changed:', {
      isLogScale,
      showFWHM,
      isZoomMode,
      showRegion,
      hasFWHM: fwhm_index !== null
    });
  }, [isLogScale, showFWHM, isZoomMode, showRegion, fwhm_index]);

  return (
    <Stack direction="row" spacing={1}>
      {regionSpectrumData && (
        <Tooltip title={showRegion ? "Hide Selected Region" : "Show Selected Region"}>
          <IconButton 
            onClick={() => setShowRegion(!showRegion)}
            color={showRegion ? "warning" : "default"}
            sx={{ 
              bgcolor: showRegion ? 'rgba(255, 127, 14, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: showRegion ? 'rgba(255, 127, 14, 0.2)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            {showRegion ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
        </Tooltip>
      )}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {!isSelectingRange && (
          <Tooltip title={isZoomMode ? "Switch to Pan Mode" : "Switch to Zoom Mode"}>
            <IconButton 
              onClick={handleZoomModeToggle} 
              color={isZoomMode ? "primary" : "default"}
              sx={{ position: 'relative', '&.disabled': { color: 'grey.500' } }}
              disabled={isSelectingRange}
            >
              {isZoomMode ? <ZoomInIcon /> : <PanToolIcon />}
              {isSelectingRange && (
                <BlockIcon 
                  sx={{ 
                    position: 'absolute',
                    color: 'red',
                    opacity: 0.7,
                  }} 
                />
              )}
            </IconButton>
          </Tooltip>
        )}
        {isSelectingRange && (
          <Tooltip title="Zoom/Pan disabled during selection">
            <span>
              <IconButton 
                disabled
                sx={{ 
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '-10%',
                    width: '120%',
                    height: '2px',
                    backgroundColor: 'red',
                    transform: 'rotate(-45deg)',
                  }
                }}
              >
                {isZoomMode ? <ZoomInIcon /> : <PanToolIcon />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title={isSelectingRange ? "Disable Selection" : "Enable Selection"}>
          <IconButton 
            onClick={handleSelectionModeToggle} 
            color={isSelectingRange ? "success" : "default"}
            sx={{ 
              bgcolor: isSelectingRange ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: isSelectingRange ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <CropIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={isLogScale ? "Switch to Linear Scale" : "Switch to Log Scale"}>
          <IconButton onClick={() => setIsLogScale(!isLogScale)} color={isLogScale ? "primary" : "default"}>
            <ScaleIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {fwhm_index !== null && (
        <Tooltip title={showFWHM ? "Hide FWHM Line" : "Show FWHM Line"}>
          <IconButton 
            onClick={() => setShowFWHM(!showFWHM)}
            color={showFWHM ? "primary" : "default"}
          >
            <Box component="span" sx={{ 
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              FWHM
            </Box>
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

export default SpectrumToolbar;