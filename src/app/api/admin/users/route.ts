import { NextRequest, NextResponse } from 'next/server';
import { auth, adminFunctions } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = adminFunctions.getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, role, action } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'setRole':
        if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          );
        }
        adminFunctions.setUserRole(email, role);
        break;
      
      case 'removeRole':
        adminFunctions.removeUserRole(email);
        break;
      
      case 'restrict':
        adminFunctions.restrictUser(email);
        break;
      
      case 'unrestrict':
        adminFunctions.unrestrictUser(email);
        break;
      
      case 'sendPasswordReset':
        // Firebase handles password reset automatically
        // Admin can guide users to use the standard Firebase password reset
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Action completed successfully' 
    });
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
