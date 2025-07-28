import { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemText, 
  ListItemIcon, 
  Typography,
  Box,
  Tooltip,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ImageSearch as ImageSearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useEmissionRangeToImageContext } from '../../../contexts/EmissionAnalysisToEmissionRangeImageContext';

/**
 * EmissionLineRangeDisplayDropdown Component
 * 
 * Allows users to select which emission line range from the collection to display as an image.
 * Shows all available emission line ranges with their element, line name, and energy values.
 * Users can also delete ranges using the "x" button on each item.
 */
function EmissionLineRangeDisplayDropdown() {
  const { ranges, displayedRangeId, setDisplayedRange, removeRange } = useEmissionRangeToImageContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const rangeCount = Object.keys(ranges).length;
  const displayedRange = displayedRangeId ? ranges[displayedRangeId] : null;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectRange = (rangeId: number) => {
    setDisplayedRange(rangeId);
    handleClose();
  };

  const handleClearSelection = () => {
    setDisplayedRange(null);
    handleClose();
  };

  const handleDeleteRange = (rangeId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent menu item click
    removeRange(rangeId);
    console.log(`Deleted emission line range ${rangeId} from dropdown`);
  };

  // Convert ranges object to array and sort by ID
  const rangeArray = Object.values(ranges).sort((a, b) => a.id - b.id);

  // If no ranges available, show disabled state
  if (rangeCount === 0) {
    return (
      <Tooltip title="No emission line ranges available - create ranges in the Emission Line Analysis first">
        <span>
          <Button
            variant="outlined"
            disabled
            size="small"
            startIcon={<ImageSearchIcon />}
            sx={{ minWidth: 180 }}
          >
            No Emission Ranges Available
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title="Select Emission Line Range to Display">
        <Button
          onClick={handleClick}
          variant={displayedRange ? "contained" : "outlined"}
          color={displayedRange ? "primary" : "inherit"}
          size="small"
          startIcon={<ImageSearchIcon />}
          endIcon={<ArrowDownIcon />}
          sx={{ minWidth: 200 }}
        >
          {displayedRange 
            ? `${displayedRange.element} ${displayedRange.lineName.toUpperCase()}` 
            : "Select Emission Range"
          }
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 350,
            maxHeight: 400,
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            Select Emission Line Range to Display ({rangeCount} available)
          </Typography>
        </Box>

        {/* Clear selection option */}
        {displayedRange && (
          <MenuItem onClick={handleClearSelection}>
            <ListItemIcon>
              <VisibilityOffIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText 
              primary="Clear Selection"
              secondary="Hide the emission line range image"
            />
          </MenuItem>
        )}

        {/* List of available emission line ranges */}
        {rangeArray.map((range) => {
          const isSelected = displayedRangeId === range.id;
          
          return (
            <MenuItem 
              key={range.id}
              onClick={() => handleSelectRange(range.id)}
              selected={isSelected}
              sx={{ 
                pr: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  }
                }
              }}
            >
              <ListItemIcon>
                {isSelected ? (
                  <VisibilityIcon fontSize="small" color="primary" />
                ) : (
                  <VisibilityOffIcon fontSize="small" color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography component="span" sx={{ fontWeight: 'medium' }}>
                      {range.element} {range.lineName.toUpperCase()}
                    </Typography>
                    <Typography component="span" variant="body2" color="text.secondary">
                      (Range {range.id})
                    </Typography>
                    {isSelected && (
                      <Chip 
                        label="Current" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={`${range.energy.start.toFixed(2)} - ${range.energy.end.toFixed(2)} keV`}
                sx={{ mr: 1 }}
              />
              <Tooltip title="Delete Emission Line Range">
                <IconButton
                  size="small"
                  onClick={(event) => handleDeleteRange(range.id, event)}
                  sx={{ 
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.dark'
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </MenuItem>
          );
        })}

        {/* Info footer */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Create more emission line ranges in the Emission Line Analysis
          </Typography>
        </Box>
      </Menu>
    </>
  );
}

export default EmissionLineRangeDisplayDropdown; 