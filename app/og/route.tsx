import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const title = searchParams.get('title') || 'Predikt';
	const score = searchParams.get('score');

	// Metrics for Radar Chart
	const technical = parseInt(searchParams.get('tech') || '50');
	const market = parseInt(searchParams.get('market') || '50');
	const execution = parseInt(searchParams.get('execution') || '50');
	const tokenomics = parseInt(searchParams.get('token') || '50'); // or AI score

	// Radar Chart Logic
	const size = 300;
	const center = size / 2;
	const radius = size * 0.4;

	// Points: Top, Right, Bottom, Left (Diamond-ish / Pentagon-ish depending on implementation)
	// Let's do a Diamond/Kite shape for 4 metrics: Top (Tech), Right (Market), Bottom (Execution), Left (Token/AI)
	// (0, -r), (r, 0), (0, r), (-r, 0) relative to center

	const getPoint = (value: number, angle: number) => {
		const r = (value / 100) * radius;
		const x = center + r * Math.cos(angle);
		const y = center + r * Math.sin(angle);
		return `${x},${y}`;
	};

	// Angles for 4 axes: -PI/2 (Top), 0 (Right), PI/2 (Bottom), PI (Left)
	const p1 = getPoint(technical, -Math.PI / 2);
	const p2 = getPoint(market, 0);
	const p3 = getPoint(execution, Math.PI / 2);
	const p4 = getPoint(tokenomics, Math.PI);

	const polyPoints = `${p1} ${p2} ${p3} ${p4}`;
	const backgroundPoly = `${getPoint(100, -Math.PI / 2)} ${getPoint(100, 0)} ${getPoint(100, Math.PI / 2)} ${getPoint(100, Math.PI)}`;


	// Load logo
	const logoData = await fetch(new URL('../../public/logo_white.png', import.meta.url)).then(
		(res) => res.arrayBuffer()
	);

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

				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 80px', zIndex: 10 }}>

					{/* LEFT SIDE: Score & Title */}
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '600px' }}>
						{/* Logo Badge */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								marginBottom: '20px',
							}}
						>
							<div style={{
								background: 'rgba(59, 130, 246, 0.2)',
								border: '1px solid rgba(147, 197, 253, 0.3)',
								borderRadius: '999px',
								padding: '8px 24px',
								display: 'flex', alignItems: 'center', gap: '8px'
							}}>
								<img width="24" height="24" src={logoData as any} />
								<div style={{ fontSize: '16px', color: '#93C5FD', fontWeight: 600 }}>PREDIKT VERIFIED</div>
							</div>
						</div>

						<div
							style={{
								fontSize: '60px',
								fontWeight: 900,
								lineHeight: '1.1',
								backgroundClip: 'text',
								color: 'white',
								marginBottom: '30px',
								textShadow: '0 2px 10px rgba(0,0,0,0.5)'
							}}
						>
							{title}
						</div>

						{score && (
							<div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
								<div style={{
									fontSize: '120px',
									fontWeight: 900,
									color: parseInt(score) >= 75 ? '#4ADE80' : parseInt(score) >= 50 ? '#FACC15' : '#F87171',
									textShadow: '0 0 40px rgba(255,255,255,0.2)',
									lineHeight: '1'
								}}>
									{score}
								</div>
								<div style={{ fontSize: '32px', color: '#94A3B8', fontWeight: 500 }}>/ 100</div>
							</div>
						)}
					</div>

					{/* RIGHT SIDE: Radar Chart */}
					<div style={{
						width: '400px',
						height: '400px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						position: 'relative'
					}}>
						{/* Chart Labels */}
						<div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', color: '#94A3B8', fontSize: '20px', fontWeight: 600 }}>TECHNICAL</div>
						<div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '20px', fontWeight: 600 }}>MARKET</div>
						<div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', color: '#94A3B8', fontSize: '20px', fontWeight: 600 }}>EXECUTION</div>
						<div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '20px', fontWeight: 600 }}>STRUCTURE</div>

						<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
							{/* Grid Lines */}
							<polygon points={backgroundPoly} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
							<line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
							<line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

							{/* Data Polygon */}
							<polygon points={polyPoints} fill="rgba(59, 130, 246, 0.3)" stroke="#60A5FA" strokeWidth="4" />

							{/* Dots */}
							<circle cx={p1.split(',')[0]} cy={p1.split(',')[1]} r="6" fill="#60A5FA" />
							<circle cx={p2.split(',')[0]} cy={p2.split(',')[1]} r="6" fill="#60A5FA" />
							<circle cx={p3.split(',')[0]} cy={p3.split(',')[1]} r="6" fill="#60A5FA" />
							<circle cx={p4.split(',')[0]} cy={p4.split(',')[1]} r="6" fill="#60A5FA" />
						</svg>
					</div>

				</div>

				<div
					style={{
						position: 'absolute',
						bottom: '40px',
						left: '40px',
						fontSize: '20px',
						color: '#475569',
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						fontFamily: 'monospace'
					}}
				>
					prediktfi.xyz
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	);
}

