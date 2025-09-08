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
					background: 'linear-gradient(135deg, #0b0b0c 0%, #1e1b4b 50%, #0d9488 100%)',
					color: 'white',
					fontFamily: 'system-ui, -apple-system, sans-serif',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<div style={{ fontSize: '72px', fontWeight: 'bold', lineHeight: '1.1' }}>Predikt</div>
						<div style={{ fontSize: '20px', opacity: 0.8, letterSpacing: '3px', textTransform: 'uppercase' }}>AI Studio</div>
					</div>
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	);
}

