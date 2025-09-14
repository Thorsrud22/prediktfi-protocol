import { NextRequest, NextResponse } from 'next/server'

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'admin145'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (password === SITE_PASSWORD) {
      // Set a secure HTTP-only cookie that expires in 24 hours
      const response = NextResponse.json({ success: true })
      
      response.cookies.set('predikt_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
