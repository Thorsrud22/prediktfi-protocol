import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Predikt Open Graph';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function GET() {
	// Minimal placeholder OG image to prevent crashes; replace with branded image later
	return new ImageResponse(
		(
			<div
				style={{
					height: '100%',
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#0b0b0c',
					color: 'white',
					fontSize: 64,
					fontWeight: 700,
				}}
			>
				Predikt
			</div>
		),
		{
			...size,
		}
	);
}

