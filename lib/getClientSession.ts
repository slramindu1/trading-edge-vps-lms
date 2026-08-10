'use client';

export async function getClientSession() {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}