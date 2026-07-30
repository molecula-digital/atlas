'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { buttonVariants, type ButtonVariant, type ButtonSize } from './button-variants'

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button }
export { buttonVariants, type ButtonVariant, type ButtonSize } from './button-variants'
