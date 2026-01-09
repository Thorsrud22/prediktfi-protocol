import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
	return new ImageResponse(
		(
			<div
				style={{
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #0B1426 0%, #1E3A8A 50%, #5B21B6 100%)',
					color: 'white',
					fontFamily: 'sans-serif',
				}}
			>
				{/* Background Noise/Grid Pattern */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.1) 2%, transparent 0%)',
						backgroundSize: '100px 100px',
						opacity: 0.2,
					}}
				/>

				<div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10 }}>
					{/* Logo Placeholder (Orb) */}
					<div
						style={{
							width: '80px',
							height: '80px',
							borderRadius: '50%',
							background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
							boxShadow: '0 0 40px rgba(96, 165, 250, 0.5)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '40px',
						}}
					>
						🔮
					</div>

					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<div
							style={{
								fontSize: '80px',
								fontWeight: 900,
								lineHeight: '1',
								background: 'linear-gradient(to right, #DBEAFE, #93C5FD)',
								backgroundClip: 'text',
								color: 'transparent',
							}}
						>
							Predikt
						</div>
						<div
							style={{
								fontSize: '28px',
								fontWeight: 500,
								marginTop: '8px',
								color: '#BFDBFE',
								letterSpacing: '2px',
								textTransform: 'uppercase',
							}}
						>
							AI Prediction Studio
						</div>
					</div>
				</div>

				<div
					style={{
						position: 'absolute',
						bottom: '60px',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						padding: '12px 24px',
						background: 'rgba(15, 23, 42, 0.6)',
						borderRadius: 'full',
						border: '1px solid rgba(148, 163, 184, 0.2)',
					}}
				>
					<div style={{ fontSize: '20px', color: '#93C5FD' }}>predikt.fi</div>
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	);
}

