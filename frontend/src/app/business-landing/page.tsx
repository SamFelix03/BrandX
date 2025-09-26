"use client"

import Header from "../../components/header"
import BusinessHeroContent from "../../components/business-hero-content"
import PulsingCircle from "../../components/pulsing-circle"
import ShaderBackground from "../../components/shader-background"

export default function BusinessLanding() {
  return (
    <ShaderBackground>
      <Header />
      <BusinessHeroContent />
    </ShaderBackground>
  )
}