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
uniform float	uUVDisIntensity;
uniform float	uCausticVisible;
uniform float	uCausticOffset;
uniform float	uChromaticOffset;

// uniform variables for texture samplers:
uniform sampler2D WaterNormal;
uniform sampler2D GroundTex;
uniform sampler2D CausticTex;

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
	// float displaced_y = amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);

	return vec2(displaced_x, displaced_z);
}

void
main( )
{	
	if ( vV.y > -0.5 ) 
	{
		vec3 Normal = normalize( gl_NormalMatrix * (0.6*vN + 0.4*(2. * texture( WaterNormal, vST ).xyz - vec3(1., 1., 1.) )) );
		vec3 Light = normalize( vL );
		vec3 Eye = normalize( vE );

		// Standard Lighting Code
		vec3 ambient = uKa * uColor.rgb;
		float dd = abs(dot(Normal,Light));			   // do diffuse for both sides of the curtain
		vec3 diffuse = uKd * dd * uColor.rgb;

		float ss = 0.;
		if( dd > 0. )								   // only do specular if the light can see the point
		{
			vec3 ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
			ss = pow( max( dot( Eye, ref ),0. ), uShininess );
		}
		vec3 specular = uKs * ss * SPECULARCOLOR.rgb;

		gl_FragColor = vec4( ambient + diffuse + specular,  1. );
	}
	else {

		// Dynamic texture sampler for the caustic effect based on the wave functions
		vec3 causticColor = texture( CausticTex, vST ).rgb;
		vec3 sineCaustic, gerstnerCaustic;
		
		// Recalculate the wave displacement for the vertex to align the texture mapping with water wave
		if ( uSineWave )
		{
			float displaced_y = SineWave(vV, vec2(uSinDx, uSinDy), uSinAmp, uSinFreq, uSinSpeed, Timer);	
			vec2 displacedUV = vST + uUVDisIntensity*vec2( 0.0, displaced_y );

			// Separate the rgb channels to simulate chromatic aberration:
			sineCaustic.r = texture( CausticTex, displacedUV + vec2( uChromaticOffset, uChromaticOffset ) * 0.5 ).r;
			sineCaustic.g = texture( CausticTex, displacedUV + vec2( -uChromaticOffset, -uChromaticOffset ) * 0.5 ).g;
			sineCaustic.b = texture( CausticTex, displacedUV + vec2( -uChromaticOffset, uChromaticOffset ) * 0.5 ).b;
		}
		if ( uGerstnerWave )
		{
			vec2 displacedxz = GesternerWave(vV, vec2(uGerstDx, uGerstDy), uGerstSteep, uGerstAmp, uGerstFreq, uGerstSpeed, Timer);	
			vec2 displacedUV = vST + uUVDisIntensity*displacedxz + vec2(-uCausticOffset, uCausticOffset);
			gerstnerCaustic.r = texture( CausticTex, displacedUV + vec2( uChromaticOffset, uChromaticOffset ) * 0.5 ).r;
			gerstnerCaustic.g = texture( CausticTex, displacedUV + vec2( -uChromaticOffset, -uChromaticOffset ) * 0.5 ).g;
			gerstnerCaustic.b = texture( CausticTex, displacedUV + vec2( -uChromaticOffset, uChromaticOffset ) * 0.5 ).b;
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

		gl_FragColor = vec4( texture(GroundTex, vST).rgb + uCausticVisible*causticColor,  1. );
	}
	
}
