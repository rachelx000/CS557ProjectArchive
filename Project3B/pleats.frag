#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;				  // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;					  // specular exponent
uniform vec4    uColor, uSpecularColor;

// uniform variables for Project #3:
uniform sampler3D Noise3;		// noise texture sampler
uniform float	  uNoiseFreq, uNoiseAmp;

// in variables from the vertex shader and interpolated in the rasterizer:

in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec3  vMC;					// model coordinates

// function to perturb the normal vector
vec3
PerturbNormal2( float angx, float angy, vec3 n )
{
        float cx = cos( angx );
        float sx = sin( angx );
        float cy = cos( angy );
        float sy = sin( angy );

        // rotate about x:
        float yp =  n.y*cx - n.z*sx;    // y'
        n.z      =  n.y*sx + n.z*cx;    // z'
        n.y      =  yp;
        // n.x      =  n.x;

        // rotate about y:
        float xp =  n.x*cy + n.z*sy;    // x'
        n.z      = -n.x*sy + n.z*cy;    // z'
        n.x      =  xp;
        // n.y      =  n.y;

        return normalize( n );
}

void
main( )
{	
	vec3 Normal = normalize( vN );
	vec3 Light = normalize( vL );
    vec3 Eye = normalize( vE );

	// Use a noise texture to derive two rotation angles for the normal around the x-axis and y-axis:
	vec4 nvx = texture( Noise3, uNoiseFreq * vMC );
	float angx = nvx.r + nvx.g + nvx.b + nvx.a -2.;		// range is -1. -> +1.
	angx *= uNoiseAmp;

	vec4 nvy = texture( Noise3, uNoiseFreq * vec3(vMC.xy, vMC.z+0.5 ));
	float angy = nvy.r + nvy.g + nvy.b + nvy.a -2.;		// range is -1. -> +1.
	angy *= uNoiseAmp;

	// Perturb the normal using the derived rotation angles
	vec3 newN = normalize( gl_NormalMatrix * PerturbNormal2( angx, angy, Normal ));

	// Standard Lighting Code
	vec3 ambient = uKa * uColor.rgb;
	float dd = max( dot(newN, Light), 0. );		   // only do diffuse if the light can see the point
	vec3 diffuse = uKd * dd * uColor.rgb;

	float ss = 0.;
	if( dd > 0. )								   // only do specular if the light can see the point
	{
		vec3 ref = normalize(2. * newN * dot(newN, Light) - Light);
		ss = pow( max( dot( Eye, ref ),0. ), uShininess );
	}
	vec3 specular = uKs * ss * uSpecularColor.rgb;

	gl_FragColor = vec4( ambient + diffuse + specular,  1. );
}

