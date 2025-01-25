#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;				  // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;					  // specular exponent
uniform vec4	uObjectColor, uEllipseColor;  // color component

// uniform variables for Project #2 -- these should be set every time Display( ) is called:
uniform sampler3D Noise3;
uniform float	uNoiseFreq, uNoiseAmp;
uniform float   uAd, uBd;
uniform float	uTol;
uniform float   uAlpha;
uniform bool	uUseXYZ;

// in variables from the vertex shader and interpolated in the rasterizer:

in  vec2  vST;					// texture coords
in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec3  vMC;					// model coordinates

// constant variables
const vec3 SPECULARCOLOR        = vec3( 1., 1., 1. );

void
main( )
{
	float s = vST.s;
	float t = vST.t;

	// get a noise from the 3D noise texture
	vec4 nv = texture( Noise3, uNoiseFreq * vec3(vST, 0.));		// index noise from 2D model coordinates
	if (uUseXYZ)
		nv = texture( Noise3, uNoiseFreq * vMC);				// index noise from 3D model coordinates

	float n = nv.r + nv.g + nv.b + nv.a;	// range is 1. -> 3.
	n -= 2;									// range is now -1. -> 1.
	n *= uNoiseAmp;
	
	int numins = int( s / uAd );
	int numint = int( t / uBd );

	// calculate the center of the current grid
	float Ar = uAd/2;
	float Br = uBd/2;
	float sc = numins*uAd + Ar;
	float tc = numint*uBd + Br;

	// calculate the distance between current fragment and the ellipse center
	// and introduce noises
	float ds = s - sc;
	float dt = t - tc;
	float oldDist = sqrt( ds*ds + dt*dt );
	float newDist = oldDist + n;
	float scale = newDist / oldDist;		// could be < 1., = 1., or > 1.

	ds *= scale;							// scale by noise factor
	dt *= scale;

	float d = (pow(ds/Ar, 2.) +  pow(dt/Br, 2.));	// ellipse equation

	// blend object and ellipse colors by using the ellipse equation to decide how close
	// this fragment is to the ellipse border:
	vec3 myColor = uObjectColor.rgb;
	float alpha = 1.;
	float m = smoothstep(1.-uTol, 1.+uTol, d);
	if( d <= 1 )
	{
		myColor = uEllipseColor.rgb;
	}
	if ((1.-uTol <= d) && (d <= 1.+uTol))
	{
		float bt = smoothstep(1.-uTol, 1.+uTol, d);
		myColor = mix(uEllipseColor.rgb, uObjectColor.rgb, bt);
	}

	// alpha value of the fragment outside the ellipse border can be adjusted
	if ( d > 1 )
	{
		if ( uAlpha > 0 )
			alpha = uAlpha;
		else
			discard;
	}

	// apply the per-fragmewnt lighting to myColor:

	vec3 Normal = normalize(vN);
	vec3 Light  = normalize(vL);
	vec3 Eye    = normalize(vE);

	vec3 ambient = uKa * myColor;

	float dd = max( dot(Normal,Light), 0. );       // only do diffuse if the light can see the point
	vec3 diffuse = uKd * dd * myColor;

	float ss = 0.;
	if( dd > 0. )								   // only do specular if the light can see the point
	{
		vec3 ref = normalize(  reflect( -Light, Normal )  );
		ss = pow( max( dot(Eye,ref),0. ), uShininess );
	}
	vec3 specular = uKs * ss * SPECULARCOLOR.rgb;
	gl_FragColor = vec4( ambient + diffuse + specular,  alpha );
}

