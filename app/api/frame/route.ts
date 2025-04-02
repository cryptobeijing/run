import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "Snake Game Frame",
    description: "Play Snake on Warpcast!",
    image: `${process.env.NEXT_PUBLIC_HOST}/snake.png`,
    buttons: [
      {
        label: "Play Snake",
        action: "post"
      },
      {
        label: "View High Scores",
        action: "post"
      }
    ],
    post_url: `${process.env.NEXT_PUBLIC_HOST}/api/frame/action`,
  });
} 