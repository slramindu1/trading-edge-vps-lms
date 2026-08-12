import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { unstable_cache } from 'next/cache';

const getCachedSection = unstable_cache(
  async (key: string) => {
    return await prisma.pageSection.findUnique({
      where: { key },
    });
  },
  ['page-section'],
  { tags: ['builder-sections'] }
);

export async function GET(req: Request) {
  try {
    // Configure CORS so the landing page can fetch it if needed.
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    if (key === 'landing-testimonials') {
      const isTestimonialEnabled = await isFeatureEnabled('testimonial-tool');
      if (!isTestimonialEnabled) {
        return NextResponse.json({ error: 'Feature disabled', isFeatureDisabled: true }, { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    const section = await getCachedSection(key);

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const response = NextResponse.json(section);
    // Allow CORS from any origin for public data (or restrict to landing page URL)
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error fetching public builder section:', error);
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
