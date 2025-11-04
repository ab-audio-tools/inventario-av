import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const handler = async (event: any) => {
  const path = event.path.replace('/.netlify/functions/auth', '');

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
      const { username, password } = JSON.parse(event.body || '{}');

      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Username and password required' }),
        };
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

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