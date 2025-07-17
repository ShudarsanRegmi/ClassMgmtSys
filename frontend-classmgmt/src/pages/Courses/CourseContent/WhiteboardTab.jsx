import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Fade,
  Grid,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  Delete as DeleteIcon,
  Download,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { useTheme } from '@mui/material/styles';
import WhiteboardShotForm from '../../../components/WhiteboardShotForm';

const WhiteboardTab = ({ shots = [], courseId, semesterId, onShotUpdate }) => {
  const { userProfile } = useAuth();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [activeStep, setActiveStep] = useState(0);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleDelete = async (shotId) => {
    if (!window.confirm('Are you sure you want to delete this whiteboard shot?')) return;
    try {
      await api.delete(`/courses/${courseId}/materials/${semesterId}/whiteboard/${shotId}`);
      if (onShotUpdate) {
        onShotUpdate(shots.filter(s => s._id !== shotId));
      }
    } catch (error) {
      console.error('Error deleting whiteboard shot:', error);
    }
  };

  const handlePreview = (shot) => {
    const images = Array.isArray(shot.files)
      ? shot.files.map(file => file.url || file)
      : [shot.fileUrl];
    setPreviewImages(images);
    setPreviewOpen(true);
    setActiveStep(0);
  };

  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);

  // ✅ Grouping shots by ISO Date and preparing for sorting
  const groupedShots = shots.reduce((groups, shot) => {
    const date = new Date(shot.lectureDate).toISOString().split('T')[0]; // YYYY-MM-DD
    if (!groups[date]) groups[date] = [];
    groups[date].push(shot);
    return groups;
  }, {});

  return (
    <Box sx={{ position: 'relative', px: { xs: 1, sm: 2, md: 4 }, py: 4 }} >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5" fontWeight={600}>Whiteboard Timeline</Typography>
        <Box
          component="button"
          onClick={handleClickOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 6,
            background: '#111',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            fontSize: '14px'
          }}
        >
          <AddIcon fontSize="small" /> Add Shot
        </Box>
      </Box>

      <Box sx={{ position: 'relative', pl: 4, borderLeft: '2px dashed #bbb' }}>
        {Object.entries(groupedShots)
          .sort((a, b) => new Date(b[0]) - new Date(a[0])) // ✅ Sort date descending
          .map(([date, dateShots]) => (
            <Box key={date} mb={6} sx={{ position: 'relative' }}>
              {/* Timeline Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -14,
                  top: 6,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  border: '2px solid white',
                  zIndex: 1,
                }}
              />

              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                {new Date(date).toLocaleDateString()}
              </Typography>

              <Grid container spacing={3}>
                {dateShots.map((shot) => (
                  <Grid item xs={12} md={6} key={shot._id}>
                    <Card
                      elevation={2}
                      sx={{
                        minWidth: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                      }}
                    >
                      <Box position="relative">
                        <CardMedia
                          component="img"
                          image={
                            Array.isArray(shot.files)
                              ? shot.files[0]?.url || shot.files[0]
                              : shot.fileUrl
                          }
                          alt={shot.title}
                          sx={{
                            maxHeight: '300px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                          }}
                          onClick={() => handlePreview(shot)}
                        />

                        {/* Multi-image badge */}
                        {Array.isArray(shot.files) && shot.files.length > 1 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 12,
                              left: 12,
                              backgroundColor: 'rgba(0,0,0,0.65)',
                              color: 'white',
                              fontSize: 13,
                              px: 1.5,
                              py: 0.3,
                              borderRadius: '8px',
                              fontWeight: 500,
                              backdropFilter: 'blur(2px)',
                            }}
                          >
                            +{shot.files.length} images
                          </Box>
                        )}

                        <IconButton
                          sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                            },
                          }}
                          onClick={() => handlePreview(shot)}
                        >
                          <ZoomInIcon />
                        </IconButton>
                      </Box>

                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {shot.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Topic: {shot.topic}
                        </Typography>
                        <Box display="flex" justifyContent="flex-end" mt={1}>
                          <IconButton
                            size="small"
                            href={
                              Array.isArray(shot.files)
                                ? shot.files[0]?.url || shot.files[0]
                                : shot.fileUrl
                            }
                            target="_blank"
                            download
                          >
                            <Download />
                          </IconButton>
                          {(userProfile.role === 'FACULTY' || userProfile.role === 'CA') && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(shot._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
      </Box>

      {/* Upload Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <WhiteboardShotForm
            courseId={courseId}
            semesterId={semesterId}
            classId={userProfile?.classId}
            onSuccess={(newShot) => {
              if (onShotUpdate) {
                onShotUpdate([...shots, newShot]);
              }
              handleClose();
            }}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#fefefe',
            borderRadius: 2,
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {previewImages.map((image, index) => (
            <Fade in={activeStep === index} key={index} timeout={300}>
              <Box
                sx={{
                  display: activeStep === index ? 'flex' : 'none',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  style={{
                    maxHeight: '70vh',
                    maxWidth: '90%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                />
              </Box>
            </Fade>
          ))}

          {previewImages.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(255,255,255,0.9)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              <IconButton onClick={handleBack} disabled={activeStep === 0} size="small">
                <KeyboardArrowLeft />
              </IconButton>
              <Typography variant="caption">{activeStep + 1} / {previewImages.length}</Typography>
              <IconButton
                onClick={handleNext}
                disabled={activeStep === previewImages.length - 1}
                size="small"
              >
                <KeyboardArrowRight />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 1,
              zIndex: 5,
            }}
          >
            <Box
              component="button"
              onClick={() => setPreviewOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '6px 12px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Close
            </Box>
            <Box
              component="a"
              href={previewImages[activeStep]}
              download
              target="_blank"
              style={{
                textDecoration: 'none',
                padding: '6px 12px',
                background: '#222',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '4px',
              }}
            >
              Download
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WhiteboardTab;
