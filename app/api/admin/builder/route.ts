import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/getServerSession';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    let section = await prisma.pageSection.findUnique({
      where: { key },
    });

    if (!section) {
      section = await prisma.pageSection.create({
        data: {
          key,
          name: key.replace(/-/g, ' ').toUpperCase(),
          elements: '[]',
          canvasW: 1200,
          canvasH: 800,
        },
      });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error fetching builder section:', error);
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, elements, canvasW, canvasH } = body;

    const section = await prisma.pageSection.upsert({
      where: { key },
      update: {
        elements: typeof elements === 'string' ? elements : JSON.stringify(elements),
        canvasW,
        canvasH,
      },
      create: {
        key,
        name: key.replace(/-/g, ' ').toUpperCase(),
        elements: typeof elements === 'string' ? elements : JSON.stringify(elements),
        canvasW,
        canvasH,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error saving builder section:', error);
    return NextResponse.json({ error: 'Failed to save section' }, { status: 500 });
  }
}
