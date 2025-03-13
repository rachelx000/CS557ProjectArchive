#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;				  // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;					  // specular exponent
uniform vec4    uColor;

// uniform variables for the Sine wave model:
uniform bool	uSineWave;
uniform float	uSinDx, uSinDy;
uniform float	uSinAmp, uSinFreq, uSinSpeed;

// uniform variables for the Gerstner wave model:
uniform bool	uGerstnerWave;
uniform float	uGerstSteep;
uniform float	uGerstDx, uGerstDy;
uniform float	uGerstAmp, uGerstFreq, uGerstSpeed;
uniform float   Timer;

// uniform variables for the Water Caustics:
uniform float	uCausticWave;
uniform float	uCausticVisible;
uniform float	uCausticOffset;
uniform float	uChromaticOffset;

// uniform variables for texture samplers:
uniform sampler2D WaterNormalUnit;
uniform sampler2D WaterFloorTexUnit;
uniform sampler2D WaterFloorNormalUnit;
uniform sampler2D CausticTexUnit;
uniform sampler2D FoamTexUnit;

// uniform variables for water effect:
uniform float	uWaterRefractMix;
uniform float	uWaterTiling;

// uniform variables for foam effect;
uniform bool	  uShowFoam;
uniform sampler3D Noise3;

// in variables from the vertex shader and interpolated in the rasterizer:
in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec2  vST;					// texture coordinate
in  vec3  vV;

// constant variables
const vec3 SPECULARCOLOR        = vec3( 1., 1., 1. );

float SineWave( vec3 vertex, vec2 direction, float amplitude, float frequency, float speed, float time)
{
	float displaced_y = amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	return displaced_y;
}

vec2 GesternerWave( vec3 vertex, vec2 direction, float steepness, float amplitude, float frequency, float speed, float time)
{
	float displaced_x = steepness*amplitude*direction.x*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float displaced_z = steepness*amplitude*direction.y*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float displaced_y = amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);

	return vec2(displaced_x, displaced_z);
}

void
main( )
{	
	/* ----------------------------------------------------
		Water Caustic Calculation Based on the Wave:
	   ----------------------------------------------------  */ 

	// Dynamic texture sampler for the caustic effect based on the wave functions
	vec3 causticColor = texture( CausticTexUnit, vST ).rgb;
	vec3 sineCaustic, gerstnerCaustic;
	
	// Recalculate the wave displacement for the vertex to align the texture mapping with water wave
	if ( uSineWave )
	{
		float displaced_y = SineWave(vV, vec2(uSinDx, uSinDy), uSinAmp, uSinFreq, uSinSpeed, Timer);	
		vec2 displacedUV = vST + uCausticWave*vec2( 0.0, displaced_y );

		// Separate the rgb channels to simulate chromatic aberration:
		sineCaustic.r = texture( CausticTexUnit, displacedUV + vec2( uChromaticOffset, uChromaticOffset ) * 0.5 ).r;
		sineCaustic.g = texture( CausticTexUnit, displacedUV + vec2( -uChromaticOffset, -uChromaticOffset ) * 0.5 ).g;
		sineCaustic.b = texture( CausticTexUnit, displacedUV + vec2( -uChromaticOffset, uChromaticOffset ) * 0.5 ).b;
	}
	if ( uGerstnerWave )
	{
		vec2 displacedxz = GesternerWave(vV, vec2(uGerstDx, uGerstDy), uGerstSteep, uGerstAmp, uGerstFreq, uGerstSpeed, Timer);	
		vec2 displacedUV = vST + uCausticWave*displacedxz + vec2(-uCausticOffset, uCausticOffset);
		gerstnerCaustic.r = texture( CausticTexUnit, displacedUV + vec2( uChromaticOffset, uChromaticOffset ) * 0.5 ).r;
		gerstnerCaustic.g = texture( CausticTexUnit, displacedUV + vec2( -uChromaticOffset, -uChromaticOffset ) * 0.5 ).g;
		gerstnerCaustic.b = texture( CausticTexUnit, displacedUV + vec2( -uChromaticOffset, uChromaticOffset ) * 0.5 ).b;
	}

	if ( uSineWave && uGerstnerWave )
	{
		causticColor = 0.6*sineCaustic + 0.6*gerstnerCaustic;
	}
	else if ( uSineWave )
	{
		causticColor = sineCaustic;
	}
	else if ( uGerstnerWave )
	{
		causticColor = gerstnerCaustic;
	}

	/*	----------------------------------------
		Texture and Lighting
		---------------------------------------- */
	vec3 Color, Normal;
	vec3 WaterFloorTexColor = texture( WaterFloorTexUnit, vST ).rgb;
	vec3 WaterFloorColor;

	// For Foam Generation: determine how close the current fragment to the peripherical edge
	vec2 distToBoundary = vec2(1.0 - abs(vV.x), 1.0 - abs(vV.z));
	float minDistToBoundary = min(distToBoundary.x, distToBoundary.y);

	if ( vV.y < -0.5 )
	{	
		// Sample the rock texture and normal map for the Water Floor:
		// convert rgb value to 0-1 normal vector:
		Normal = normalize( gl_NormalMatrix * (2. * texture( WaterFloorNormalUnit, vST ).xyz - vec3(1., 1., 1.)) );
		
		// mix the water floor texture color with the caustic color:
		WaterFloorColor = WaterFloorTexColor + uCausticVisible*causticColor;
		Color = WaterFloorColor;
	}
	else
	{
		// Add the normal for the water surface retrived from the water normal map
		Normal = normalize( gl_NormalMatrix * (vN + (2. * texture( WaterNormalUnit, uWaterTiling*vST ).xyz - vec3(1., 1., 1.) )) );
		// blend water Color with the Flit,oor Color to make the fake water refraction effect
		Color = mix( uColor.rgb, WaterFloorTexColor, uWaterRefractMix );

		if ( uShowFoam )
		{
			// Generate foams for the boundary of the water surface:
			if ( minDistToBoundary <= 0.08 ){
				float t = smoothstep(0.08, 0.0, minDistToBoundary);
				float noiseFactor = texture( Noise3, vec3(vST, 0.)).r;
				float FoamTexColor1 = texture( FoamTexUnit, 3*vST - Timer*(uSinSpeed+uGerstSpeed)*0.5*0.5).r;
				float FoamTexColor2 = texture( FoamTexUnit, 10*vST - Timer*(uSinSpeed+uGerstSpeed)*0.5*0.5 ).b;
				float FoamMultiplier = 1. - clamp(FoamTexColor1 + FoamTexColor2*0.5, 0, 1);
				vec3 FoamColor = vec3( 1., 1., 1. )*FoamMultiplier;
				Color += FoamColor*t*(uSinAmp+uGerstAmp)*10;
			}
		}
	}
	// Standard Lighting Calculations:
	
	vec3 Light = normalize( vL );
	vec3 Eye = normalize( vE );

	// Standard Lighting Code
	vec3 ambient = uKa * Color;
	float dd = abs(dot(Normal,Light));			   // do diffuse for both sides of the curtain
	vec3 diffuse = uKd * dd * Color;

	float ss = 0.;
	if( dd > 0. )								   // only do specular if the light can see the point
	{
		vec3 ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
		ss = pow( max( dot( Eye, ref ),0. ), uShininess );
	}
	vec3 specular = uKs * ss * SPECULARCOLOR.rgb;

	if ( vV.y < -0.5 )
	{
		// No specular for water floor
		gl_FragColor = vec4( ambient + diffuse,  1. );
	}
	else 
	{
		if ( uShowFoam && minDistToBoundary <= 0.08 ) 
		{
			gl_FragColor = vec4( ambient + diffuse,  1. );
		}
		else {
			gl_FragColor = vec4( ambient + diffuse + specular,  1. );
		}
	}
	
}