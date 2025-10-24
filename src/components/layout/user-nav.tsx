'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Menu, MenuItem } from '@mui/material'

export function UserNav() {
  const { data: session } = useSession()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!session) {
    return <Button onClick={() => signIn('google')}>Log in</Button>
  }

  return (
    <div>
      <Button
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        variant="text"
        className="relative h-8 w-8 rounded-full"
      >
        <Avatar src={session.user?.image ?? ''} alt={session.user?.name ?? ''}>
            {session.user?.name?.[0]}
        </Avatar>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <div className="px-4 py-2">
            <p className="text-sm font-medium leading-none">{session.user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user?.email}
            </p>
        </div>
        <hr />
        <MenuItem onClick={() => {handleClose(); signOut()}}>Log out</MenuItem>
      </Menu>
    </div>
  )
}