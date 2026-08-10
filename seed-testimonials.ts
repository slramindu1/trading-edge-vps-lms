import { PrismaClient } from './lib/generated/prisma';

const prisma = new PrismaClient();

const images = [
  "/assets/5.jpg",
  "/assets/new3.jpg",
  "/assets/new7.jpg",
  "/assets/4.jpg",
  "/assets/new10.jpg",
  "/assets/new13.jpg",
  "/assets/new1.jpg",
  "/assets/new4.jpg",
  "/assets/new5.jpg",
  "/assets/new8.jpg",
  "/assets/new11.jpg",
  "/assets/11.jpg",
  "/assets/new2.jpg",
  "/assets/new6.jpg",
  "/assets/new9.jpg",
  "/assets/new12.jpg",
  "/assets/new14.jpg",
];

async function main() {
  const elements = [];
  
  const colWidth = 370;
  const gap = 30;
  const canvasW = 1200;
  
  let colHeights = [0, 0, 0]; // Track height of each column

  for (let i = 0; i < images.length; i++) {
    const colIndex = i % 3;
    
    // Assign random heights for the masonry effect (between 300px and 500px)
    const height = Math.floor(Math.random() * 200) + 300; 
    
    const x = colIndex * (colWidth + gap);
    const y = colHeights[colIndex];
    
    elements.push({
      id: `el_img_${i}`,
      type: "image",
      x,
      y,
      width: colWidth,
      height,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      borderRadius: 16, // rounded-2xl
      shadow: true,
      visible: true,
      imageUrl: images[i],
    });
    
    colHeights[colIndex] += height + gap;
  }
  
  // Calculate max height for canvas
  const canvasH = Math.max(...colHeights) + 100;

  await prisma.pageSection.upsert({
    where: { key: 'landing-testimonials' },
    update: {
      elements: JSON.stringify(elements),
      canvasW,
      canvasH,
    },
    create: {
      key: 'landing-testimonials',
      name: 'LANDING TESTIMONIALS',
      elements: JSON.stringify(elements),
      canvasW,
      canvasH,
    }
  });

  console.log("Successfully seeded landing-testimonials!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
