#version 330 compatibility

// uniform variables for lighting:
uniform float uLightX, uLightY, uLightZ;

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

// out variables:
out vec3 vN;
out vec3 vL;
out vec3 vE;

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
	
	vec3  vert = gl_Vertex.xyz;
	vec3  displacement = vec3(0, 0, 0);
	vec3  normal = vec3(0, 0, 0);

	// If the sine wave model is applied:
	if (uSineWave)
	{
		vec2  sinDirect = vec2(uSinDx, uSinDy);
		// calculate y-displacement for the sine wave:
		float displaced_y = SineWave(vert, sinDirect, uSinAmp, uSinFreq, uSinSpeed, Timer);	
		displacement.y += displaced_y;
		// calculate the normal displacement after y-displacement by the sine wave:
		normal += SineWaveNormal(vert, sinDirect, uSinAmp, uSinFreq, uSinSpeed, Timer);
	}

	// If the gerstner wave model is applied:
	if ( uGerstnerWave )
	{
		vec2 gerstDirect = vec2(uGerstDx, uGerstDy);
		// calculate x, y, z-displacement for the gerstner wave:
		displacement += GesternerWave(vert, gerstDirect, uGerstSteep, uGerstAmp, uGerstFreq, uGerstSpeed, Timer);
		// calculate the normal displacement after displacement by the gerstner wave:
		normal += vec3(0., 1., 0.) - GesternerNormal(vert, gerstDirect, uGerstSteep, uGerstAmp, uGerstFreq, uGerstSpeed, Timer);
	}
	
	if ( uSineWave || uGerstnerWave )
	{
		// displace the vertex and perturb the normal if any wave model is used
		vert += displacement;
		vN = normalize( gl_NormalMatrix * normal );
	}
	else {
		// only compute the normal if any wave model is not used
		vN = normalize( gl_NormalMatrix * gl_Normal );
	}

	// Calculate the vectors for lighting:
	vec4 ECposition = gl_ModelViewMatrix * vec4( vert, 1. );
	vec3 LightPosition = vec3( uLightX, uLightY, uLightZ );		// light coordinate position
	vL = normalize( LightPosition - ECposition.xyz );           // vector from the point to the light position
	vE = normalize( vec3( 0., 0., 0. ) - ECposition.xyz );		// vector from the point to the eye position

	gl_Position = gl_ModelViewProjectionMatrix * vec4( vert, 1. );
}
