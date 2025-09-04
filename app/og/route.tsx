import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
			width: 1200,
			height: 630,
		}
	);
}

