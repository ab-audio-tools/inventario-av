import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const handler = async (event: any) => {
  console.log('Auth function called:', event.httpMethod, event.path);
  const path = event.path.replace('/.netlify/functions/auth', '');
  console.log('Extracted path:', path);

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (path === '/session' && event.httpMethod === 'GET') {
      // Check session - for now return null (no session management in serverless)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: null }),
      };
    }

    if (path === '/login' && event.httpMethod === 'POST') {
      console.log('Processing login request');
      const { username, password } = JSON.parse(event.body || '{}');
      console.log('Login attempt for user:', username);

      if (!username || !password) {
        console.log('Missing username or password');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Username and password required' }),
        };
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });
      console.log('User found in database:', !!user);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log('Invalid credentials');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login successful for user:', userWithoutPassword.username);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: userWithoutPassword,
          message: 'Login successful'
        }),
      };
    }

    if (path === '/logout' && event.httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Logged out successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  } finally {
    await prisma.$disconnect();
  }
};