import { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  IconButton,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import { 
  CropFree as CropFreeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { useSpectrumContext } from '../../../contexts/SpectrumViewerToSpectrumRangeVisualizer';

interface RangeSelectionDropdownProps {
  isSelectingRange: boolean;
  onSelectionModeChange: (isSelecting: boolean) => void;
}

/**
 * RangeSelectionDropdown Component
 * 
 * Replaces the simple CropIcon button with a dropdown that allows users to:
 * - Start new range selection
 * - View all existing ranges
 * - Delete ranges with X button
 * - See range count (e.g., "3/10 ranges")
 */
function RangeSelectionDropdown({ isSelectingRange, onSelectionModeChange }: RangeSelectionDropdownProps) {
  const { ranges, removeRange } = useSpectrumContext();
  const [anchorElem, setAnchorElem] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorElem);

  const rangeCount = Object.keys(ranges).length;
  const isAtLimit = rangeCount >= 10;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElem(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElem(null);
  };

  const handleStartSelection = () => {
    if (!isAtLimit) {
      onSelectionModeChange(true);
    }
    handleClose();
  };

  const handleStopSelection = () => {
    onSelectionModeChange(false);
    handleClose();
  };

  const handleDeleteRange = (rangeId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent menu item click
    removeRange(rangeId);
  };

  // Convert ranges object to array and sort by ID in ascending order
  const rangeArray = Object.values(ranges).sort((a, b) => a.id - b.id);

  return (
    <>
      <Tooltip title="Manage Range Selection">
        <Button
          onClick={handleClick}
          variant={isSelectingRange ? "contained" : "outlined"}
          color={isSelectingRange ? "success" : "primary"}
          size="small"
          endIcon={<ArrowDownIcon />}
          sx={{ 
            minWidth: 'auto',
            px: 1,
            '& .MuiButton-endIcon': {
              ml: 0.5
            }
          }}
        >
          <CropFreeIcon fontSize="small" />
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorElem}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxHeight: 400,
          }
        }}
      >
        {/* Header with range count */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            Range Selection ({rangeCount}/10 ranges)
          </Typography>
        </Box>

        {/* Start/Stop Selection Option */}
        {isSelectingRange ? (
          <MenuItem onClick={handleStopSelection}>
            <ListItemIcon>
              <CloseIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Stop Selection" 
              secondary="Cancel current selection"
            />
          </MenuItem>
        ) : (
          <MenuItem 
            onClick={handleStartSelection}
            disabled={isAtLimit}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" color={isAtLimit ? "disabled" : "success"} />
            </ListItemIcon>
            <ListItemText 
              primary={isAtLimit ? "Maximum Ranges Reached" : "Start New Selection"}
              secondary={isAtLimit ? "Delete a range to add new ones" : "Select a range on the spectrum"}
            />
          </MenuItem>
        )}

        {/* Divider if we have existing ranges */}
        {rangeArray.length > 0 && <Divider />}

        {/* List of existing ranges */}
        {rangeArray.length > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Existing Ranges:
            </Typography>
          </Box>
        )}

        {rangeArray.map((range) => (
          <MenuItem key={range.id} sx={{ pr: 1 }}>
            <ListItemText 
              primary={`Range ${range.id}`}
              secondary={`${range.energy.start.toFixed(1)} - ${range.energy.end.toFixed(1)} keV`}
              sx={{ mr: 1 }}
            />
            <Tooltip title="Delete Range">
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
        ))}

        {/* Empty state message */}
        {rangeArray.length === 0 && (
          <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No ranges created yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Start a new selection to create your first range
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
}

export default RangeSelectionDropdown; 