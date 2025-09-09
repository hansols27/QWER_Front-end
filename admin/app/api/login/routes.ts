import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // ⚡ 여기서 실제 DB에서 사용자 확인 로직이 들어가야 함
    // 지금은 mock 데이터로 처리
    if (email === "admin@test.com" && password === "1234") {
      return NextResponse.json({
        success: true,
        message: "로그인 성공",
        user: { email },
        token: "mock-jwt-token", // 실제로는 JWT나 세션 토큰 발급
      })
    }

    return NextResponse.json(
      { success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: "서버 오류 발생" },
      { status: 500 }
    )
  }
}
