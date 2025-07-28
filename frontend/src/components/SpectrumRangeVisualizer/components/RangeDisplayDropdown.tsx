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
  Chip
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ImageSearch as ImageSearchIcon
} from '@mui/icons-material';
import { useSpectrumContext } from '../../../contexts/SpectrumViewerToSpectrumRangeVisualizer';

/**
 * RangeDisplayDropdown Component
 * 
 * Allows users to select which range from the collection to display as an image.
 * Shows all available ranges with their energy values and allows clearing the selection.
 */
function RangeDisplayDropdown() {
  const { ranges, displayedRangeId, setDisplayedRange } = useSpectrumContext();
  const [anchorElem, setAnchorElem] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorElem);

  const rangeCount = Object.keys(ranges).length;
  const displayedRange = displayedRangeId ? ranges[displayedRangeId] : null;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElem(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElem(null);
  };

  const handleSelectRange = (rangeId: number) => {
    setDisplayedRange(rangeId);
    handleClose();
  };

  const handleClearSelection = () => {
    setDisplayedRange(null);
    handleClose();
  };

  // Convert ranges object to array and sort by ID
  const rangeArray = Object.values(ranges).sort((a, b) => a.id - b.id);

  // If no ranges available, show disabled state
  if (rangeCount === 0) {
    return (
      <Tooltip title="No ranges available - create ranges in the Spectrum Viewer first">
        <span>
          <Button
            variant="outlined"
            disabled
            size="small"
            startIcon={<ImageSearchIcon />}
            sx={{ minWidth: 160 }}
          >
            No Ranges Available
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title="Select Range to Display">
        <Button
          onClick={handleClick}
          variant={displayedRange ? "contained" : "outlined"}
          color={displayedRange ? "primary" : "inherit"}
          size="small"
          startIcon={<ImageSearchIcon />}
          endIcon={<ArrowDownIcon />}
          sx={{ minWidth: 180 }}
        >
          {displayedRange 
            ? `Range ${displayedRange.id}` 
            : "Select Range"
          }
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorElem}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 300,
            maxHeight: 400,
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            Select Range to Display ({rangeCount} available)
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
              secondary="Hide the range image"
            />
          </MenuItem>
        )}

        {/* List of available ranges */}
        {rangeArray.map((range) => {
          const isSelected = displayedRangeId === range.id;
          
          return (
            <MenuItem 
              key={range.id}
              onClick={() => handleSelectRange(range.id)}
              selected={isSelected}
              sx={{ 
                pr: 2,
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
                    <Typography component="span">
                      Range {range.id}
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
                secondary={`${range.energy.start.toFixed(1)} - ${range.energy.end.toFixed(1)} keV`}
              />
            </MenuItem>
          );
        })}

        {/* Info footer */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Create more ranges in the Spectrum Viewer
          </Typography>
        </Box>
      </Menu>
    </>
  );
}

export default RangeDisplayDropdown; 