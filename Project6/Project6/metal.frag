#version 330 compatibility

in vec3 vNormal;
in vec3 vEyeDir;
in vec3 vMC;
uniform samplerCube uReflectUnit;

uniform sampler3D Noise3;
uniform float	  uNoiseAmp, uNoiseFreq;

vec3
PerturbNormal3( float angx, float angy, float angz, vec3 n )
{
	float cx = cos( angx );
	float sx = sin( angx );
	float cy = cos( angy );
	float sy = sin( angy );
	float cz = cos( angz );
	float sz = sin( angz );
	
	// rotate about x:
	float yp =  n.y*cx - n.z*sx;	// y'
	n.z      =  n.y*sx + n.z*cx;	// z'
	n.y      =  yp;
	// n.x      =  n.x;

	// rotate about y:
	float xp =  n.x*cy + n.z*sy;	// x'
	n.z      = -n.x*sy + n.z*cy;	// z'
	n.x      =  xp;
	// n.y      =  n.y;

	// rotate about z:
	      xp =  n.x*cz - n.y*sz;	// x'
	n.y      =  n.x*sz + n.y*cz;	// y'
	n.x      = xp;
	// n.z      =  n.z;

	return normalize( n );
}

void main( )
{
    vec3 normal = normalize( vNormal );
	vec3 eye = normalize( vEyeDir );

	// Use a noise texture to derive rotation angles for the normal around the three axes:
	vec4 nvx = texture( Noise3, uNoiseFreq * vMC );
	float angx = nvx.r + nvx.g + nvx.b + nvx.a -2.;		// range is -1. -> +1.
	angx *= uNoiseAmp;

	vec4 nvy = texture( Noise3, uNoiseFreq * vec3(vMC.xy, vMC.z+0.33 ));
	float angy = nvy.r + nvy.g + nvy.b + nvy.a -2.;		// range is -1. -> +1.
	angy *= uNoiseAmp;

	vec4 nvz = texture( Noise3, uNoiseFreq * vec3(vMC.xy, vMC.z+0.67 ));
	float angz = nvz.r + nvz.g + nvz.b + nvz.a -2.;		// range is -1. -> +1.
	angz *= uNoiseAmp;

	normal = PerturbNormal3( angx, angy, angz, normal );
	normal = normalize( gl_NormalMatrix * normal );

    vec3 reflectVector = reflect( eye, normal );
    vec3 reflectColor = texture( uReflectUnit, reflectVector ).rgb;

	gl_FragColor = vec4(reflectColor, 1. );

}