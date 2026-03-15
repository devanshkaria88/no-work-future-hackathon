import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test_token';
process.env.NEXT_PUBLIC_WS_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';
process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test_agent_id';
