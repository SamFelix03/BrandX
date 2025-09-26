"use client"

import React, { useEffect, useState } from 'react'

interface BusinessGradientBackgroundProps {
  children: React.ReactNode
  logoUrl?: string
}

export default function BusinessGradientBackground({ children, logoUrl }: BusinessGradientBackgroundProps) {
  const [gradientColors, setGradientColors] = useState<string[]>([
    '#000000', // Pure black base
    '#000000', // Pure black base
    '#000000', // Pure black base
    '#000000', // Pure black base
    '#000000'  // Pure black base
  ])

  useEffect(() => {
    if (!logoUrl) return

    // Create a temporary canvas to extract colors from the logo
    const extractColorsFromImage = async () => {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Set canvas size to image size
          canvas.width = img.width
          canvas.height = img.height

          // Draw image to canvas
          ctx.drawImage(img, 0, 0)

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // Sample colors from the image (every 100th pixel for performance)
          const colors: string[] = []
          for (let i = 0; i < data.length; i += 400) { // Every 100th pixel (4 bytes per pixel)
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const alpha = data[i + 3]

            // Only include colors with sufficient opacity
            if (alpha > 128) {
              colors.push(`rgb(${r}, ${g}, ${b})`)
            }
          }

          // Get the most prominent colors (limit to 5 for gradient)
          const prominentColors = getProminentColors(colors)
          
          // Convert to very subtle hints - slightly more visible
          const darkThemeColors = prominentColors.map(color => {
            const darkened = darkenColor(color, 0.92) // Darken by 92% for subtle hints
            // Make it subtle by mixing with black
            return mixWithBlack(darkened, 0.90) // Mix 90% black with the color
          })

          // Ensure we have at least 3 colors for a good gradient
          if (darkThemeColors.length >= 3) {
            setGradientColors(darkThemeColors)
          }
        }

        img.src = logoUrl
      } catch (error) {
        console.log('Could not extract colors from logo:', error)
        // Keep default colors
      }
    }

    extractColorsFromImage()
  }, [logoUrl])

  // Helper function to get prominent colors from an array
  const getProminentColors = (colors: string[]): string[] => {
    // Simple color clustering - group similar colors
    const clusters: { [key: string]: number } = {}
    
    colors.forEach(color => {
      // Round RGB values to reduce noise
      const rounded = color.replace(/\d+/g, (match) => {
        const num = parseInt(match)
        return Math.round(num / 20) * 20 + ''
      })
      
      clusters[rounded] = (clusters[rounded] || 0) + 1
    })

    // Sort by frequency and take top colors
    const sortedColors = Object.entries(clusters)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color)

    return sortedColors.length > 0 ? sortedColors : [
      '#000000', '#000000', '#000000', '#000000', '#000000'
    ]
  }

  // Helper function to darken a color
  const darkenColor = (color: string, factor: number): string => {
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return color

    const r = Math.round(parseInt(rgb[0]) * factor)
    const g = Math.round(parseInt(rgb[1]) * factor)
    const b = Math.round(parseInt(rgb[2]) * factor)

    return `rgb(${r}, ${g}, ${b})`
  }

  // Helper function to mix a color with black
  const mixWithBlack = (color: string, blackRatio: number): string => {
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return color

    const r = Math.round(parseInt(rgb[0]) * (1 - blackRatio))
    const g = Math.round(parseInt(rgb[1]) * (1 - blackRatio))
    const b = Math.round(parseInt(rgb[2]) * (1 - blackRatio))

    return `rgb(${r}, ${g}, ${b})`
  }

  // Create extremely subtle CSS gradient string
  const gradientString = `radial-gradient(ellipse at center, ${gradientColors.join(', ')})`

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-black"
      style={{
        background: gradientString,
        backgroundAttachment: 'fixed'
      }}
    >
      {children}
    </div>
  )
}