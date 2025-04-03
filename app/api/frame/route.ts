import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "Run Game Frame",
    description: "Play Run on Warpcast!",
    image: `${process.env.NEXT_PUBLIC_HOST}/run.png`,
    buttons: [
      {
        label: "Play Run",
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