#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;				  // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;					  // specular exponent
uniform vec4    uColor;

uniform sampler2D WaterNormal;
uniform float	  uLightMapHeight;
uniform sampler2D LightMap;
uniform float	  uCausticMix;

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

// in variables from the vertex shader and interpolated in the rasterizer:
in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec2  vST;					// texture coordinate
in  vec3  vV;

// constant variables
const vec3 SPECULARCOLOR = vec3( 1., 1., 1. );
const vec3 GROUNDCOLOR	 = vec3( 0.439, 0.439, 0.439 );
const float WATERIOR = 1.33;
const float AIRIOR = 1.00;


float SineWave( vec3 vertex, vec2 direction, float amplitude, float frequency, float speed, float time)
{
	float displaced_y = amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	return displaced_y;
}

vec3 SineWaveNormal( vec3 vertex, vec2 direction, float amplitude, float frequency, float speed, float time)
{
	float ddx = frequency*direction.x*amplitude*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float ddz = frequency*direction.y*amplitude*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	// vec3 normal = normalize( gl_NormalMatrix * vec3(-ddx,  1., -ddz) );
	return vec3(-ddx,  1., -ddz);
}

vec3 GesternerWave( vec3 vertex, vec2 direction, float steepness, float amplitude, float frequency, float speed, float time)
{
	float displaced_x = steepness*amplitude*direction.x*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float displaced_z = steepness*amplitude*direction.y*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float displaced_y = amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);

	return vec3(displaced_x, displaced_y, displaced_z);
}

vec3 GesternerNormal( vec3 vertex, vec2 direction, float steepness, float amplitude, float frequency, float speed, float time )
{
	float ddx = frequency*direction.x*amplitude*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float ddz = frequency*direction.y*amplitude*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float ddy = steepness*frequency*amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);

	return vec3(ddx, ddy, ddz);
}


void
main( )
{	
	if ( vV.y >= -0.5 )
	{
		// Use normal mapping to simulate the water surface
		// sample from the normal map of the water surface and turn it into (nx, ny, nz)
		vec3 Normal = normalize( gl_NormalMatrix * (0.7*vN + 0.3*(2. * texture( WaterNormal, vST ).xyz - vec3(1., 1., 1.) )) );
		vec3 Light = normalize( vL );
		vec3 Eye = normalize( vE );

		// Perform Standard Lighting for the water surface
		vec3 ambient = uKa * uColor.rgb;
		float dd = abs(dot(Normal,Light));			   // do diffuse for both sides of the curtain
		vec3 diffuse = uKd * dd * uColor.rgb;

		float ss = 0.;
		if( dd > 0. )								   // only do specular if the light can see the point
		{
			Normal = normalize( gl_NormalMatrix * Normal );
			vec3 ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
			ss = pow( max( dot( Eye, ref ),0. ), uShininess );
		}
		vec3 specular = uKs * ss * SPECULARCOLOR.rgb;
		
		gl_FragColor = vec4( ambient + diffuse + specular,  1. );
	}
	else{
		// Calculate the water surface point directly above the current water floor point:
		vec3  surface_point = vV + vec3(0., 1., 0.);
		vec3  displacement = vec3(0, 0, 0);
		vec3  normal = vec3(0, 0, 0);

		if (uSineWave)
		{
			vec2  sinDirect = vec2(uSinDx, uSinDy);
			// calculate y-displacement for the sine wave:
			float displaced_y = SineWave(surface_point, sinDirect, uSinAmp, uSinFreq, uSinSpeed, Timer);	
			displacement.y += displaced_y;
			// calculate the normal displacement after y-displacement by the sine wave:
			normal += SineWaveNormal(surface_point, sinDirect, uSinAmp, uSinFreq, uSinSpeed, Timer);
		}

		if ( uGerstnerWave )
		{
			vec2 gerstDirect = vec2(uGerstDx, uGerstDy);
			// calculate x, y, z-displacement for the gerstner wave:
			displacement += GesternerWave(surface_point, gerstDirect, uGerstSteep, uGerstAmp, uGerstFreq, uGerstSpeed, Timer);
			// calculate the normal displacement after displacement by the gerstner wave:
			normal += vec3(0., 1., 0.) - GesternerNormal(surface_point, gerstDirect, uGerstSteep, uGerstAmp, uGerstFreq, uGerstSpeed, Timer);
		}
	
		if ( uSineWave || uGerstnerWave )
		{
			surface_point += displacement;
			vec3 surface_normal = normalize( normal );
			
			// Then, send a vertical ray from the current point of the water floor:
			vec3 floor_normal = vec3( 0., 1., 0. );

			// Calculate the refracted ray from this vertical ray at the calculated point of the water surface:
			vec3 refracted_ray = refract( floor_normal, surface_normal, WATERIOR / AIRIOR );

			vec3 causticColor = GROUNDCOLOR;
			// Check if the refracted ray can hit the presumed light map right above the water:
			if ( refracted_ray.y > 0. )
			{
				float t = uLightMapHeight - surface_point.y / refracted_ray.y;
				if ( t <= 0. ) {
					vec3 intercept = vec3( surface_point.x + t * refracted_ray.x, uLightMapHeight, surface_point.z + t * refracted_ray.z );
					if ( -1. <= intercept.x && intercept.x <= 1. && -1. <= intercept.z && intercept.z <= 1.)
					{
						vec2 causticST = vec2(intercept.x - (-1.)/2., intercept.z - (-1.)/2.);
						causticColor = vec3(1., 1., 1.);
						// causticColor = texture( LightMap, causticST ).rgb;
					}
				}
			}
			// gl_FragColor = vec4( causticColor, 1. );
			gl_FragColor = vec4( mix( causticColor, GROUNDCOLOR, uCausticMix ), 1. );
		}
		else {
			gl_FragColor = vec4( GROUNDCOLOR, 1. );
		}
	}

}
