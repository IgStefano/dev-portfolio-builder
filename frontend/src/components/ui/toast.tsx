import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-2',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const toastVariants = cva(
  'rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur',
  {
    variants: {
      variant: {
        default: 'border-gray-700 bg-gray-900/90 text-gray-200',
        error: 'border-red-600/30 bg-red-900/80 text-red-200',
        warning: 'border-yellow-600/30 bg-yellow-900/80 text-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn('text-sm underline hover:opacity-80', className)}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('hover:opacity-80', className)}
    {...props}
  />
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
}
