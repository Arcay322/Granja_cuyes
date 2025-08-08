import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import api from '../../services/api';

const ReportsTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testTemplates = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing /api/reports/templates...');
      const response = await api.get('/reports/templates');
      console.log('Templates response:', response.data);
      setResult(response.data);
    } catch (error: any) {
      console.error('Templates error:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const testExport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing /api/reports/export/inventory...');
      const response = await api.post('/reports/export/inventory', {
        format: 'PDF',
        parameters: {
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        },
        options: {
          includeCharts: true,
          includeDetails: true,
          pageSize: 'A4',
          orientation: 'portrait',
          compression: true
        }
      });
      console.log('Export response:', response.data);
      setResult(response.data);
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const testJobStatus = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing /api/reports/jobs/history...');
      const response = await api.get('/reports/jobs/history');
      console.log('Job history response:', response.data);
      setResult(response.data);
    } catch (error: any) {
      console.error('Job history error:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('Current token:', token);
    console.log('Token valid:', token ? isTokenValid(token) : false);
  };

  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      console.log('Token payload:', payload);
      console.log('Current time:', currentTime);
      console.log('Token exp:', payload.exp);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Reports API Test
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          onClick={testTemplates}
          disabled={loading}
        >
          Test Templates
        </Button>
        
        <Button 
          variant="contained" 
          onClick={testExport}
          disabled={loading}
        >
          Test Export
        </Button>
        
        <Button 
          variant="contained" 
          onClick={testJobStatus}
          disabled={loading}
        >
          Test Job History
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={checkAuth}
        >
          Check Auth
        </Button>
      </Box>

      {loading && (
        <Alert severity="info">Loading...</Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Result:</Typography>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default ReportsTest;