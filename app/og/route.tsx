import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const title = searchParams.get('title') || 'Predikt';
	const score = searchParams.get('score');

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
					background: 'linear-gradient(135deg, #0B1426 0%, #172554 100%)',
					color: 'white',
					fontFamily: 'sans-serif',
				}}
			>
				{/* Background Pattern */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
						backgroundSize: '80px 80px',
					}}
				/>

				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 10, padding: '40px', textAlign: 'center' }}>
					{/* Badge */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							background: 'rgba(59, 130, 246, 0.15)',
							border: '1px solid rgba(147, 197, 253, 0.3)',
							borderRadius: 'full',
							padding: '10px 24px',
						}}
					>
						<div style={{ fontSize: '24px' }}>🔮</div>
						<div style={{ fontSize: '20px', color: '#93C5FD', fontWeight: 600, letterSpacing: '1px' }}>PREDIKT VERIFIED</div>
					</div>

					{/* Title */}
					<div
						style={{
							fontSize: '70px',
							fontWeight: 900,
							lineHeight: '1.1',
							backgroundImage: 'linear-gradient(to bottom right, #FFFFFF, #93C5FD)',
							backgroundClip: 'text',
							color: 'transparent',
							maxWidth: '900px',
							marginTop: '20px',
							marginBottom: '20px',
						}}
					>
						{title}
					</div>

					{/* Score Card */}
					{score ? (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								background: 'rgba(15, 23, 42, 0.6)',
								border: '2px solid rgba(59, 130, 246, 0.4)',
								borderRadius: '24px',
								padding: '20px 60px',
								boxShadow: '0 0 60px rgba(59, 130, 246, 0.2)',
							}}
						>
							<div style={{ fontSize: '24px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '5px' }}>Overall Score</div>
							<div
								style={{
									fontSize: '90px',
									fontWeight: 900,
									color: parseInt(score) >= 75 ? '#4ADE80' : parseInt(score) >= 50 ? '#FACC15' : '#F87171',
									textShadow: '0 0 30px rgba(255,255,255,0.2)',
								}}
							>
								{score}
							</div>
						</div>
					) : (
						<div style={{ fontSize: '32px', color: '#64748B' }}>AI Prediction Studio</div>
					)}
				</div>

				<div
					style={{
						position: 'absolute',
						bottom: '50px',
						fontSize: '24px',
						color: '#475569',
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
					}}
				>
					predikt.fi
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	);
}

